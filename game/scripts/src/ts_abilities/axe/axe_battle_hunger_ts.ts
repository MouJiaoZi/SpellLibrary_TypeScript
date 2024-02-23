import { BaseAbility, BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';

@registerAbility()
class axe_battle_hunger_ts extends BaseAbility {
    GetIntrinsicModifierName(): string {
        return 'modifier_axe_battle_hunger_ts';
    }

    OnSpellStart(): void {
        const target = this.GetCursorTarget();
        if (TriggerStandardTargetSpellEffect(this, target)) return;
        target.AddNewModifier(this.GetCaster(), this, 'modifier_axe_battle_hunger_debuff_ts', { duration: this.GetSpecialValueFor('duration') });
    }
}

@registerModifier()
class modifier_axe_battle_hunger_ts extends BaseModifier {
    private _caster = this.GetCaster();

    IsHidden(): boolean {
        return !this._caster.HasScepter() ? true : this.GetStackCount() == 0;
    }

    IsPurgable(): boolean {
        return false;
    }

    RemoveOnDeath(): boolean {
        return false;
    }

    AllowIllusionDuplicate(): boolean {
        return false;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.PHYSICAL_ARMOR_BONUS, ModifierFunction.MOVESPEED_BONUS_PERCENTAGE];
    }

    GetModifierPhysicalArmorBonus(): number {
        return this._caster.HasScepter() ? this.GetAbility().GetSpecialValueFor('scepter_armor_change') * (this.GetStackCount() / 2) : 0;
    }

    GetModifierMoveSpeedBonus_Percentage(): number {
        return this.GetAbility().GetSpecialValueFor('speed_bonus') * (this.GetStackCount() / 2);
    }
}

@registerModifier()
class modifier_axe_battle_hunger_debuff_ts extends BaseModifier {
    private _ability = this.GetAbility();
    private _caster = this.GetCaster();
    private _parent = this.GetParent();
    private _armor_reduce = this._caster.HasScepter()
        ? 0 - this._ability.GetSpecialValueFor('scepter_armor_change') / (this._parent.IsRealHero() ? 1 : 2)
        : 0;

    private _ms_reduce = this._ability.GetSpecialValueFor('slow') / (this._parent.IsRealHero() ? 1 : 2);
    private _pfx: ParticleID;

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.MOVESPEED_BONUS_PERCENTAGE,
            ModifierFunction.PHYSICAL_ARMOR_BONUS,
            ModifierFunction.ON_UNIT_MOVED,
            ModifierFunction.ON_DEATH,
        ];
    }

    OnDeath(event: ModifierInstanceEvent): void {
        if (IsServer() && event.attacker == this._parent) {
            this.Destroy();
        }
    }

    OnUnitMoved(event: ModifierUnitEvent): void {
        if (IsServer() && (event.unit == this._parent || event.unit == this._caster)) {
            const axe_face = (this._parent.GetAbsOrigin() - this._caster.GetAbsOrigin()) as Vector;
            const target_face = this._parent.GetLeftVector();
            const angle = AngleDiff(VectorToAngles(axe_face).y, VectorToAngles(target_face).y);
            this.SetStackCount(angle < 0 ? -1 : 0);
        }
    }

    GetModifierMoveSpeedBonus_Percentage(): number {
        return this.GetStackCount() == -1 ? this._ms_reduce : 0;
    }

    GetModifierPhysicalArmorBonus(event: ModifierAttackEvent): number {
        return this._armor_reduce;
    }

    OnCreated(params: object): void {
        if (IsServer()) {
            const buff = this._caster.FindModifierByName('modifier_axe_battle_hunger_ts');
            if (buff) {
                buff.IncrementStackCount();
                if (this._parent.IsRealHero()) buff.IncrementStackCount();
            }
            this._pfx = ParticleManager.CreateParticle(
                'particles/units/heroes/hero_axe/axe_battle_hunger.vpcf',
                ParticleAttachment.OVERHEAD_FOLLOW,
                this._parent
            );
            this.StartIntervalThink(1);
            this._parent.EmitSound('Hero_Axe.Battle_Hunger');
        }
    }

    OnRefresh(params: object): void {
        if (IsServer()) {
            this._parent.EmitSound('Hero_Axe.Battle_Hunger');
            const pfx = ParticleManager.CreateParticle(
                'particles/units/heroes/hero_axe/axe_battle_hunger.vpcf',
                ParticleAttachment.OVERHEAD_FOLLOW,
                this._parent
            );
            Timers.CreateTimer(0.5, () => {
                ParticleManager.DestroyParticle(pfx, true);
                ParticleManager.ReleaseParticleIndex(pfx);
            });
        }
    }

    OnIntervalThink(): void {
        const damage =
            this._ability.GetSpecialValueFor('damage_per_second') +
            this._ability.GetSpecialValueFor('armor_multiplier') * this._parent.GetPhysicalArmorValue(false);
        ApplyDamage({
            attacker: this._caster,
            victim: this._parent,
            ability: this._ability,
            damage: damage,
            damage_type: this._ability.GetAbilityDamageType(),
            damage_flags: DamageFlag.NONE,
        });
    }

    OnDestroy(): void {
        if (IsServer()) {
            const buff = this._caster.FindModifierByName('modifier_axe_battle_hunger_ts');
            if (buff) {
                buff.DecrementStackCount();
                if (this._parent.IsRealHero()) buff.DecrementStackCount();
            }
            ParticleManager.DestroyParticle(this._pfx, false);
            ParticleManager.ReleaseParticleIndex(this._pfx);
        }
    }
}
