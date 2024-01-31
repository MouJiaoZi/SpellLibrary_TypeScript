import { BaseAbility, BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';

@registerAbility()
class antimage_blink_ts extends BaseAbility {
    OnSpellStart(): void {
        const caster = this.GetCaster();
        const start_pos = caster.GetAbsOrigin();
        const point = this.GetCursorPosition();
        const max_range = this.GetEffectiveCastRange(point, caster);
        const min_range = this.GetSpecialValueFor('min_blink_range');
        const direction = point.__sub(caster.GetAbsOrigin()).Normalized();
        const range = Math.max(Math.min(point.__sub(caster.GetAbsOrigin()).Length2D(), max_range), min_range);
        const target_point = caster.GetAbsOrigin().__add(direction.__mul(range));
        FindClearSpaceForUnit(caster, target_point, true);
        ProjectileManager.ProjectileDodge(caster);

        const start_pfx = ParticleManager.CreateParticle(
            'particles/units/heroes/hero_antimage/antimage_blink_start.vpcf',
            ParticleAttachment.ABSORIGIN,
            caster
        );
        ParticleManager.SetParticleControl(start_pfx, 0, start_pos);
        ParticleManager.SetParticleControlForward(start_pfx, 0, direction);
        ParticleManager.SetParticleControlEnt(start_pfx, 1, caster, ParticleAttachment.ABSORIGIN_FOLLOW, 'attach_hitloc', start_pos, true);
        ParticleManager.ReleaseParticleIndex(start_pfx);
        const end_pfx = ParticleManager.CreateParticle(
            'particles/units/heroes/hero_antimage/antimage_blink_end.vpcf',
            ParticleAttachment.ABSORIGIN_FOLLOW,
            caster
        );
        ParticleManager.ReleaseParticleIndex(end_pfx);

        const sound_npc = CreateModifierThinker(
            caster,
            this,
            'modifier_antimage_blink_sound',
            { duration: 0.1 },
            start_pos,
            caster.GetTeamNumber(),
            false
        );
        EmitSoundOn('Hero_Antimage.Blink_out', sound_npc);
        EmitSoundOn('Hero_Antimage.Blink_in', caster);
    }
}

@registerModifier()
class modifier_antimage_blink_sound extends BaseModifier {}
