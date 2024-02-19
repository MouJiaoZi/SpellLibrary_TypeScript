import { BaseAbility, BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';

@registerAbility()
class axe_berserkers_call_ts extends BaseAbility {
    GetCastRange(location: Vector, target: CDOTA_BaseNPC): number {
        return this.GetSpecialValueFor('radius') - this.GetCaster().GetCastRangeBonus();
    }

    GetCooldown(level: number): number {
        return super.GetCooldown(level) - this.GetSpecialValueFor('scepter_cooldown_reduction');
    }

    OnAbilityPhaseStart(): boolean {
        this.GetCaster().EmitSound('Hero_Axe.BerserkersCall.Start');
        return true;
    }

    OnAbilityPhaseInterrupted(): void {
        this.GetCaster().StopSound('Hero_Axe.BerserkersCall.Start');
    }

    OnSpellStart(): void {
        const caster = this.GetCaster();
        const targets = FindUnitsInRadius(
            caster.GetTeamNumber(),
            caster.GetAbsOrigin(),
            null,
            this.GetSpecialValueFor('radius'),
            UnitTargetTeam.ENEMY,
            UnitTargetType.BASIC + UnitTargetType.HERO,
            UnitTargetFlags.MAGIC_IMMUNE_ENEMIES,
            FindOrder.ANY,
            true
        );
        for (const target of targets) {
            target.AddNewModifier(caster, this, 'modifier_axe_berserkers_call_ts_taunt', { duration: this.GetSpecialValueFor('duration') });
            target.Stop();
            target.MoveToTargetToAttack(caster);
        }
        caster.AddNewModifier(caster, this, 'modifier_axe_berserkers_call_ts_armor', { duration: this.GetSpecialValueFor('duration') });

        caster.EmitSound('Hero_Axe.Berserkers_Call');
        const pfx = ParticleManager.CreateParticle(
            'particles/units/heroes/hero_axe/axe_beserkers_call_owner.vpcf',
            ParticleAttachment.ABSORIGIN_FOLLOW,
            caster
        );
        ParticleManager.SetParticleControlEnt(pfx, 1, caster, ParticleAttachment.POINT_FOLLOW, 'attach_mouth', Vector(0, 0, 0), true);
        ParticleManager.ReleaseParticleIndex(pfx);
    }
}

@registerModifier()
class modifier_axe_berserkers_call_ts_armor extends BaseModifier {
    private _armor = this.GetAbility().GetSpecialValueFor('bonus_armor');

    IsPurgable(): boolean {
        return false;
    }

    IsHidden(): boolean {
        return false;
    }

    OnRefresh(params: object): void {
        this._armor = this.GetAbility().GetSpecialValueFor('bonus_armor');
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.PHYSICAL_ARMOR_BONUS];
    }

    GetModifierPhysicalArmorBonus(event: ModifierAttackEvent): number {
        return this._armor;
    }
}

@registerModifier()
class modifier_axe_berserkers_call_ts_taunt extends BaseModifier {
    IsPurgable(): boolean {
        return false;
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        if (IsServer()) {
            if (!this.GetCaster().IsAlive()) this.Destroy();
        }
        return {
            [ModifierState.TAUNTED]: true,
            [ModifierState.COMMAND_RESTRICTED]: true,
        };
    }
}
