import { BaseAbility, BaseModifier, registerAbility, registerModifier } from '../utils/dota_ts_adapter';

@registerAbility()
class ability_dummy_thinker extends BaseAbility {
    GetIntrinsicModifierName(): string {
        return 'modifier_dummy_thinker';
    }
}

@registerModifier()
class modifier_dummy_thinker extends BaseModifier {
    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.ALLOW_PATHING_THROUGH_BASE_BLOCKER]: true,
            [ModifierState.ALLOW_PATHING_THROUGH_CLIFFS]: true,
            [ModifierState.ALLOW_PATHING_THROUGH_FISSURE]: true,
            [ModifierState.ALLOW_PATHING_THROUGH_OBSTRUCTIONS]: true,
            [ModifierState.ALLOW_PATHING_THROUGH_TREES]: true,
            [ModifierState.ATTACK_IMMUNE]: true,
            [ModifierState.COMMAND_RESTRICTED]: true,
            [ModifierState.DEBUFF_IMMUNE]: true,
            [ModifierState.FLYING]: true,
            [ModifierState.INVULNERABLE]: true,
            [ModifierState.NOT_ON_MINIMAP]: true,
            [ModifierState.NO_HEALTH_BAR]: true,
            [ModifierState.NO_UNIT_COLLISION]: true,
            [ModifierState.OUT_OF_GAME]: true,
            [ModifierState.UNSELECTABLE]: true,
            [ModifierState.TRUESIGHT_IMMUNE]: true,
            [ModifierState.STUNNED]: true,
            [ModifierState.ROOTED]: true,
        };
    }
}

@registerModifier()
class modifier_dummy_kill extends BaseModifier {
    private buff: string = '';
    OnCreated(params: Record<'buff', string>): void {
        if (IsServer()) {
            this.buff = params['buff'];
            this.StartIntervalThink(1.0);
        }
    }

    OnIntervalThink(): void {
        if (!this.GetParent().HasModifier(this.buff)) {
            this.Destroy();
            this.GetParent().RemoveAllModifiers(0, false, true, true);
            this.GetParent().ForceKill(false);
            UTIL_Remove(this.GetParent());
        }
    }
}
