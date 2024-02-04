import { BaseAbility, registerAbility } from '../../utils/dota_ts_adapter';

@registerAbility()
class antimage_counterspell_ally_ts extends BaseAbility {
    CastFilterResultTarget(target: CDOTA_BaseNPC): UnitFilterResult {
        if (target == this.GetCaster()) return UnitFilterResult.FAIL_FRIENDLY;
        if (target.IsHero() && !IsEnemy(target, this.GetCaster())) return UnitFilterResult.SUCCESS;
    }

    OnSpellStart(): void {
        const caster = this.GetCaster();
        const target = this.GetCursorTarget();
        if (!target) return;
        target.AddNewModifier(caster, this, 'modifier_antimage_counterspell_ts_active', { duration: this.GetSpecialValueFor('duration') });
    }
}
