import { BaseAbility, BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { reloadable } from '../../utils/tstl-utils';

@registerAbility()
export class antimage_mana_break_ts extends BaseAbility {
    GetIntrinsicModifierName(): string {
        return modifier_antimage_mana_break_ts.name;
    }

    OnAbilityUpgrade(): void {
        this.GetCaster().FindModifierByName(this.GetIntrinsicModifierName())?.ForceRefresh();
    }
}

@registerModifier()
class modifier_antimage_mana_break_ts extends BaseModifier {
    private _ability = this.GetAbility();
    private _parent = this.GetParent() as CDOTA_BaseNPC_Hero;
    private _mana_burn_base: number = 0;
    private _max_mana_burn_pct: number = 0;
    private _slow_duration: number = 0;
    private _illusion_pct: number = 0;
    private _damage_per_burn: number = 0;

    IsHidden() {
        return true;
    }

    IsPurgable() {
        return false;
    }

    IsDebuff() {
        return false;
    }

    OnCreated(): void {
        this._mana_burn_base = this._ability.GetSpecialValueFor('mana_per_hit');
        this._max_mana_burn_pct = this._ability.GetSpecialValueFor('mana_per_hit_pct');
        this._slow_duration = this._ability.GetSpecialValueFor('slow_duration');
        this._illusion_pct = this._ability.GetSpecialValueFor('illusion_percentage');
        this._damage_per_burn = this._ability.GetSpecialValueFor('percent_damage_per_burn');
    }

    OnRefresh(): void {
        this.OnCreated();
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.PROCATTACK_BONUS_DAMAGE_PHYSICAL];
    }

    GetModifierProcAttack_BonusDamage_Physical(event: ModifierAttackEvent): number {
        if (
            IsServer() &&
            !this._parent.PassivesDisabled() &&
            this._parent == event.attacker &&
            IsCommonUnit(event.target) &&
            !event.target.IsMagicImmune() &&
            IsEnemy(this._parent, event.target)
        ) {
            const target = event.target;
            let mana_burn = math.min(target.GetMana(), this._mana_burn_base + target.GetMaxMana() * this._max_mana_burn_pct * 0.01);
            if (this._parent.IsIllusion()) mana_burn *= this._illusion_pct * 0.01;
            target.SetMana(target.GetMana() - mana_burn);
            let pfx_name = ParticleManager.GetParticleReplacement('particles/generic_gameplay/generic_manaburn.vpcf', this._parent);
            if (target.GetMana() == 0) {
                target.AddNewModifier(this._parent, this._ability, modifier_antimage_mana_break_ts_slow.name, { duration: this._slow_duration });
                pfx_name = ParticleManager.GetParticleReplacement('particles/units/heroes/hero_antimage/antimage_manabreak_slow.vpcf', this._parent);
            }
            const pfx = ParticleManager.CreateParticle(pfx_name, ParticleAttachment.ABSORIGIN_FOLLOW, target);
            ParticleManager.ReleaseParticleIndex(pfx);
            target.EmitSound(target.GetManaPercent() <= 40 ? 'Hero_Antimage.ManaBreak.LowMana' : 'Hero_Antimage.ManaBreak');
            return mana_burn * this._damage_per_burn * 0.01;
        }
    }
}

@registerModifier()
class modifier_antimage_mana_break_ts_slow extends BaseModifier {
    private _ability = this.GetAbility();
    private _slow_pct: number = 0;

    IsDebuff() {
        return true;
    }

    OnCreated(): void {
        this._slow_pct = this._ability.GetSpecialValueFor('move_slow');
    }

    OnRefresh(): void {
        this.OnCreated();
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MOVESPEED_BONUS_PERCENTAGE];
    }

    GetModifierMoveSpeedBonus_Percentage(): number {
        return -this._slow_pct;
    }
}
