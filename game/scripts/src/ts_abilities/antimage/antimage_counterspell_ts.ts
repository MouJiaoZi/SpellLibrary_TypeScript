import { BaseAbility, BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';

@registerAbility()
class antimage_counterspell_ts extends BaseAbility {
    GetIntrinsicModifierName(): string {
        return modifier_antimage_counterspell_passive.name;
    }

    OnSpellStart(): void {
        this.GetCaster().AddNewModifier(this.GetCaster(), this, modifier_antimage_counterspell_active.name, {
            duration: this.GetSpecialValueFor('duration'),
        });
        //TODO 幻象获得反射
    }
}

@registerModifier()
class modifier_antimage_counterspell_passive extends BaseModifier {
    private _parent = this.GetParent();
    private _ability = this.GetAbility();

    IsHidden(): boolean {
        return true;
    }

    IsPurgable(): boolean {
        return false;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MAGICAL_RESISTANCE_BONUS];
    }

    GetModifierMagicalResistanceBonus(): number {
        return this._parent.PassivesDisabled() || this._parent.IsIllusion() ? 0 : this._ability.GetSpecialValueFor('magic_resistance');
    }
}

@registerModifier()
class modifier_antimage_counterspell_active extends BaseModifier {
    private _parent = this.GetParent();
    private _ability = this.GetAbility();
    private _pfx: ParticleID | undefined;

    GetPriority(): ModifierPriority {
        return ModifierPriority.SUPER_ULTRA;
    }

    IsHidden(): boolean {
        return false;
    }

    IsPurgable(): boolean {
        return true;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.REFLECT_SPELL, ModifierFunction.ABSORB_SPELL];
    }

    OnCreated(params: object): void {
        if (!IsServer()) return;
        EmitSoundOn('Hero_Antimage.Counterspell.Cast', this.GetParent());
        const pfx = ParticleManager.CreateParticle(
            'particles/units/heroes/hero_antimage/antimage_counter.vpcf',
            ParticleAttachment.CUSTOMORIGIN_FOLLOW,
            this._parent
        );
        ParticleManager.SetParticleControlEnt(pfx, 0, this._parent, ParticleAttachment.POINT_FOLLOW, 'attach_hitloc', Vector(-25, 0, -25), false);
        ParticleManager.SetParticleControl(pfx, 1, Vector(this._parent.GetHullRadius() * 5, 100, 0));
        this.AddParticle(pfx, false, false, -1, false, false);
        this._pfx = pfx;
    }

    OnDestroy(): void {
        if (!IsServer()) return;
        if (this._pfx) {
            ParticleManager.DestroyParticle(this._pfx, false);
            ParticleManager.ReleaseParticleIndex(this._pfx);
        }
    }

    GetAbsorbSpell(event: ModifierAbilityEvent): 0 | 1 {
        if (
            IsServer() &&
            !event.ability.GetAbilityName().includes('phantom_assassin_phantom_strike') &&
            !event.ability.GetAbilityName().includes('riki_blink_strike') &&
            IsCommonUnit(event.ability.GetCaster()) &&
            IsEnemy(this._parent, event.ability.GetCaster())
        ) {
            EmitSoundOn('Hero_Antimage.Counterspell.Absorb', this._parent);
            return 1;
        }

        return 0;
    }

    GetReflectSpell(event: ModifierAbilityEvent): 0 | 1 {
        if (
            IsServer() &&
            !event.ability.GetAbilityName().includes('phantom_assassin_phantom_strike') &&
            !event.ability.GetAbilityName().includes('riki_blink_strike')
        ) {
            if (IsCommonUnit(event.ability.GetCaster()) && IsEnemy(this._parent, event.ability.GetCaster())) {
                const ability =
                    this._parent.FindAbilityByName(event.ability.GetAbilityName()) ?? this._parent.AddAbility(event.ability.GetAbilityName());
                ability.SetLevel(event.ability.GetLevel());
                ability.SetHidden(true);
                ability.SetStolen(true);
                ability.SetActivated(false);
                this._parent.SetCursorCastTarget(event.ability.GetCaster());
                event.ability.GetCaster().EmitSound('Hero_Antimage.Counterspell.Target');
                ability.OnSpellStart();
                Timers.CreateTimer(10, () => {
                    this._parent.RemoveAbilityByHandle(ability);
                });
                return 1;
            }
        }
        return 0;
    }
}
