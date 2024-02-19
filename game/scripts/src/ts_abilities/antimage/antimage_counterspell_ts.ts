import { BaseAbility, BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';

@registerAbility()
class antimage_counterspell_ts extends BaseAbility {
    GetIntrinsicModifierName(): string {
        return modifier_antimage_counterspell_passive.name;
    }

    OnSpellStart(): void {
        const caster = this.GetCaster();
        caster.AddNewModifier(caster, this, 'modifier_antimage_counterspell_ts_active', {
            duration: this.GetSpecialValueFor('duration'),
        });
        const illusions = FindUnitsInRadius(
            caster.GetTeamNumber(),
            caster.GetAbsOrigin(),
            null,
            25000,
            UnitTargetTeam.FRIENDLY,
            UnitTargetType.HERO,
            UnitTargetFlags.NONE,
            FindOrder.ANY,
            false
        ).filter(
            v =>
                v.IsIllusion() &&
                v.GetUnitName() == caster.GetUnitName() &&
                v.GetPlayerOwnerID() == caster.GetPlayerOwnerID() &&
                v.HasModifier('modifier_antimage_mana_overload_ts_illusion_auto_attack')
        );
        for (const illusion of illusions) {
            illusion.AddNewModifier(caster, this, 'modifier_antimage_counterspell_ts_active', {
                duration: this.GetSpecialValueFor('duration'),
            });
        }
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
class modifier_antimage_counterspell_ts_active extends BaseModifier {
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
                const origin_ability = this._parent.FindAbilityByName(event.ability.GetAbilityName());
                const ability =
                    origin_ability && origin_ability.IsStolen() ? origin_ability : this._parent.AddAbility(event.ability.GetAbilityName());
                ability.SetLevel(event.ability.GetLevel());
                ability.SetHidden(true);
                ability.SetStolen(true);
                ability.SetActivated(false);
                this._parent.SetCursorCastTarget(event.ability.GetCaster());
                event.ability.GetCaster().EmitSound('Hero_Antimage.Counterspell.Target');
                ability.OnSpellStart();
                if (ability != origin_ability)
                    Timers.CreateTimer(10, () => {
                        this._parent.RemoveAbilityByHandle(ability);
                    });
                //魔晶 产生幻象
                if (this.GetCaster().HasShard()) {
                    const illusion = CreateIllusions(
                        this.GetCaster(),
                        this.GetCaster() as CDOTA_BaseNPC_Hero,
                        {
                            outgoing_damage: this._ability.GetSpecialValueFor('outgoing_damage'),
                            incoming_damage: this._ability.GetSpecialValueFor('incoming_damage'),
                        },
                        1,
                        event.ability.GetCaster().GetHullRadius(),
                        false,
                        true
                    );
                    FindClearSpaceForUnit(illusion[0], event.ability.GetCaster().GetAbsOrigin(), true);
                    illusion[0].AddNewModifier(this._parent, this._ability, 'modifier_kill', {
                        duration: this._ability.GetSpecialValueFor('duration_illusion'),
                    });
                    illusion[0].AddNewModifier(this._parent, this._ability, 'modifier_antimage_counterspell_ts_illusion_no_control', {});
                    illusion[0].SetForceAttackTarget(event.ability.GetCaster());
                }
                return 1;
            }
        }
        return 0;
    }
}

@registerModifier()
class modifier_antimage_counterspell_ts_illusion_no_control extends BaseModifier {
    IsHidden(): boolean {
        return true;
    }

    IsPurgable(): boolean {
        return false;
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.COMMAND_RESTRICTED]: true,
        };
    }
}
