/**
 * 该单位是一个非建筑非守卫单位
 * @param unit 要判断的单位
 */
function IsCommonUnit(unit: CDOTA_BaseNPC): boolean {
    return !unit.IsBuilding() && !unit.IsCourier() && !unit.IsWard() && !unit.IsOther();
}

/**
 * 两个单位是否是敌对关系
 * @param unit 单位1
 * @param target 单位2
 * @returns
 */
function IsEnemy(unit: CDOTA_BaseNPC, target: CDOTA_BaseNPC): boolean {
    return unit.GetTeamNumber() != target.GetTeamNumber();
}

function TriggerStandardTargetSpellEffect(ability: CDOTABaseAbility, target: CDOTA_BaseNPC): boolean {
    target.TriggerSpellReflect(ability);
    return target.TriggerSpellAbsorb(ability);
}
