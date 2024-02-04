import { BaseAbility, registerAbility } from '../../utils/dota_ts_adapter';

@registerAbility()
class antimage_mana_void_ts extends BaseAbility {
    GetAOERadius(): number {
        return this.GetSpecialValueFor('mana_void_aoe_radius');
    }

    OnAbilityPhaseStart(): boolean {
        if (IsServer()) {
            this.GetCursorTarget().EmitSound('Hero_Antimage.ManaVoidCast');
        }
        return true;
    }

    OnSpellStart(): void {
        const caster = this.GetCaster();
        const target = this.GetCursorTarget();
        const damage = this.GetSpecialValueFor('mana_void_damage_per_mana');
        const manaBurn = target.GetMaxMana() - target.GetMana();
        const damageDealt = manaBurn * damage;
        const radius = this.GetSpecialValueFor('mana_void_aoe_radius');

        target.EmitSound('Hero_Antimage.ManaVoid');

        const enemies = FindUnitsInRadius(
            caster.GetTeamNumber(),
            target.GetAbsOrigin(),
            undefined,
            radius,
            UnitTargetTeam.ENEMY,
            UnitTargetType.HERO + UnitTargetType.BASIC,
            UnitTargetFlags.NONE,
            FindOrder.ANY,
            false
        );

        for (const enemy of enemies) {
            enemy.AddNewModifier(caster, this, 'modifier_stunned', {
                duration: this.GetSpecialValueFor('mana_void_ministun'),
            });

            ApplyDamage({
                attacker: caster,
                victim: enemy,
                ability: this,
                damage: damageDealt,
                damage_type: this.GetAbilityDamageType(),
            });
        }

        const pfx = ParticleManager.CreateParticle(
            'particles/units/heroes/hero_antimage/antimage_manavoid.vpcf',
            ParticleAttachment.ABSORIGIN_FOLLOW,
            target
        );
        ParticleManager.SetParticleControl(pfx, 1, Vector(radius, radius, radius));
        ParticleManager.ReleaseParticleIndex(pfx);
    }
}
