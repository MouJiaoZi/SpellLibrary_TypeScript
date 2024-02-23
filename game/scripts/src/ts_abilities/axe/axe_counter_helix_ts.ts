import { BaseAbility, BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';

@registerAbility()
class axe_counter_helix_ts extends BaseAbility {
    GetIntrinsicModifierName(): string {
        return 'modifier_axe_counter_helix_ts';
    }

    OnUpgrade(): void {
        this.GetCaster().FindModifierByName('modifier_axe_counter_helix_ts').SetStackCount(this.GetSpecialValueFor('trigger_attacks'));
    }

    OnOwnerSpawned(): void {
        this.GetCaster().FindModifierByName('modifier_axe_counter_helix_ts').SetStackCount(this.GetSpecialValueFor('trigger_attacks'));
    }

    GetCastRange(location: Vector, target: CDOTA_BaseNPC): number {
        return this.GetSpecialValueFor('radius') - this.GetCaster().GetCastRangeBonus();
    }
}

@registerModifier()
class modifier_axe_counter_helix_ts extends BaseModifier {
    private _ability = this.GetAbility();
    private _caster = this.GetCaster();

    IsHidden(): boolean {
        return false;
    }

    IsPurgable(): boolean {
        return false;
    }

    RemoveOnDeath(): boolean {
        return true;
    }

    AllowIllusionDuplicate(): boolean {
        return true;
    }

    OnCreated(params: object): void {
        if (IsServer()) {
            this.SetStackCount(this._ability.GetSpecialValueFor('trigger_attacks'));
        }
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ON_ATTACK_LANDED];
    }

    OnAttackLanded(event: ModifierAttackEvent): void {
        if (
            IsServer() &&
            event.target == this._caster &&
            !this._caster.PassivesDisabled() &&
            !event.attacker.IsBuilding() &&
            !event.attacker.IsWard() &&
            this._ability.IsCooldownReady()
        ) {
            this._ability.UseResources(false, false, false, true);
            this.SetStackCount(this.GetStackCount() - 1);
            if (this.GetStackCount() <= 0) {
                this.SetStackCount(this._ability.GetSpecialValueFor('trigger_attacks'));
                this._caster.EmitSound('Hero_Axe.CounterHelix');

                this._caster.StartGesture(GameActivity.DOTA_CAST_ABILITY_3);
                const pfx = ParticleManager.CreateParticle(
                    'particles/units/heroes/hero_axe/axe_counterhelix.vpcf',
                    ParticleAttachment.ABSORIGIN_FOLLOW,
                    this._caster
                );
                ParticleManager.SetParticleControlEnt(
                    pfx,
                    0,
                    this._caster,
                    ParticleAttachment.POINT_FOLLOW,
                    'attach_hitloc',
                    this._caster.GetAbsOrigin(),
                    true
                );
                ParticleManager.ReleaseParticleIndex(pfx);

                const enemies = FindUnitsInRadius(
                    this._caster.GetTeamNumber(),
                    this._caster.GetAbsOrigin(),
                    undefined,
                    this._ability.GetSpecialValueFor('radius'),
                    UnitTargetTeam.ENEMY,
                    UnitTargetType.HERO + UnitTargetType.BASIC,
                    UnitTargetFlags.MAGIC_IMMUNE_ENEMIES,
                    FindOrder.ANY,
                    true
                );
                for (const enemy of enemies) {
                    ApplyDamage({
                        attacker: this._caster,
                        damage: this._ability.GetSpecialValueFor('damage'),
                        damage_type: this._ability.GetAbilityDamageType(),
                        victim: enemy,
                        ability: this._ability,
                        damage_flags: DamageFlag.NONE,
                    });
                    if (this._caster.HasShard()) {
                        enemy.AddNewModifier(this._caster, this._ability, 'modifier_axe_counter_helix_debuff_ts', {
                            duration: this._ability.GetSpecialValueFor('shard_debuff_duration'),
                        });
                    }
                }
            }
        }
    }
}

@registerModifier()
class modifier_axe_counter_helix_debuff_ts extends BaseModifier {
    private _ability = this.GetAbility();
    private _caster = this.GetCaster();
    private _parent = this.GetParent();

    IsHidden(): boolean {
        return false;
    }

    IsPurgable(): boolean {
        return false;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.DAMAGEOUTGOING_PERCENTAGE];
    }

    GetModifierDamageOutgoing_Percentage(event: ModifierAttackEvent): number {
        if (event.target == this._caster && event.attacker == this._parent && !event.inflictor) {
            return 0 - this.GetStackCount() * this._ability.GetSpecialValueFor('shard_damage_reduction');
        }
        return 0;
    }

    OnCreated(params: object): void {
        if (IsServer()) {
            this.SetStackCount(math.min(this.GetStackCount() + 1, this._ability.GetSpecialValueFor('shard_max_stacks')));
        }
    }

    OnRefresh(params: object): void {
        this.OnCreated(params);
    }
}
