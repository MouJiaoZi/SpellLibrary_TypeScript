import { BaseAbility, BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';

@registerAbility()
class antimage_mana_overload_ts extends BaseAbility {
    GetCastRange(location: Vector, target: CDOTA_BaseNPC): number {
        const blink = this.GetCaster().FindAbilityByName('antimage_blink_ts');
        if (blink && blink.GetLevel() > 0) return blink.GetEffectiveCastRange(location, target) - this.GetCaster().GetCastRangeBonus();
        return 750;
    }

    OnSpellStart(): void {
        const caster = this.GetCaster();
        const pos = this.GetCursorPosition();
        const target = this.GetCursorTarget();
        if (!target && !pos) return;
        if (target && TriggerStandardTargetSpellEffect(this, target)) return;
        const illusion = CreateIllusions(
            caster,
            caster as CDOTA_BaseNPC_Hero,
            {
                outgoing_damage: this.GetSpecialValueFor('outgoing_damage'),
                incoming_damage: this.GetSpecialValueFor('incoming_damage'),
            },
            1,
            caster.GetHullRadius(),
            false,
            true
        );
        FindClearSpaceForUnit(illusion[0], target ? target.GetAbsOrigin() : pos, true);
        illusion[0].AddNewModifier(caster, this, 'modifier_kill', {
            duration: this.GetSpecialValueFor('duration'),
        });
        illusion[0].AddNewModifier(caster, this, 'modifier_antimage_counterspell_ts_illusion_no_control', {});
        if (target) {
            illusion[0].FaceTowards(target.GetAbsOrigin());
            illusion[0].SetForceAttackTarget(target);
        } else {
            illusion[0].AddNewModifier(caster, this, 'modifier_antimage_mana_overload_ts_illusion_auto_attack', {});
        }

        const start_pfx = ParticleManager.CreateParticle(
            'particles/units/heroes/hero_antimage/antimage_blink_start.vpcf',
            ParticleAttachment.ABSORIGIN,
            caster
        );
        const start_pos = caster.GetAbsOrigin();
        const direction = illusion[0].GetAbsOrigin().__sub(start_pos).Normalized();
        ParticleManager.SetParticleControl(start_pfx, 0, start_pos);
        ParticleManager.SetParticleControlForward(start_pfx, 0, direction);
        ParticleManager.SetParticleControlEnt(start_pfx, 1, caster, ParticleAttachment.ABSORIGIN_FOLLOW, 'attach_hitloc', start_pos, true);
        ParticleManager.ReleaseParticleIndex(start_pfx);
        const end_pfx = ParticleManager.CreateParticle(
            'particles/units/heroes/hero_antimage/antimage_blink_end.vpcf',
            ParticleAttachment.ABSORIGIN_FOLLOW,
            illusion[0]
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
class modifier_antimage_mana_overload_ts_illusion_auto_attack extends BaseModifier {
    private _parent = this.GetParent();

    IsHidden(): boolean {
        return true;
    }

    IsPurgable(): boolean {
        return false;
    }

    OnCreated(params: object): void {
        if (IsServer()) {
            this.StartIntervalThink(0.1);
            const target = FindUnitsInRadius(
                this._parent.GetTeamNumber(),
                this._parent.GetAbsOrigin(),
                null,
                1200,
                UnitTargetTeam.ENEMY,
                UnitTargetType.HERO,
                UnitTargetFlags.FOW_VISIBLE,
                FindOrder.CLOSEST,
                false
            )[0];
            if (target) {
                this._parent.FaceTowards(target.GetAbsOrigin());
            }
        }
    }

    OnIntervalThink(): void {
        if (!this._parent.GetAttackTarget()) {
            const target = FindUnitsInRadius(
                this._parent.GetTeamNumber(),
                this._parent.GetAbsOrigin(),
                null,
                1200,
                UnitTargetTeam.ENEMY,
                UnitTargetType.HERO,
                UnitTargetFlags.FOW_VISIBLE,
                FindOrder.CLOSEST,
                false
            )[0];
            this._parent.SetForceAttackTarget(target);
        }
    }
}
