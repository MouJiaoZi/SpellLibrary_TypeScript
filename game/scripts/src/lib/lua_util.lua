function CreateModifierThinker(hCaster, hAbility, sModifierName, tParamTable, vPosition, iTeamNumber, bPhantomBlocker)
	local dummy = CreateUnitByName('npc_dummy_thinker', vPosition, false, hCaster, hCaster, iTeamNumber);
    local dummy_ability = dummy:FindAbilityByName('ability_dummy_thinker');
	if dummy_ability then
    	dummy_ability:SetLevel(0);
	end
    dummy:RemoveModifierByName('modifier_dummy_thinker');
    dummy:AddNewModifier(hCaster, hAbility, sModifierName, tParamTable);
    dummy:AddNewModifier(dummy, nil, 'modifier_dummy_kill', { buff = sModifierName });
    if dummy_ability then
    	dummy_ability:SetLevel(1);
	end
    dummy:AddNewModifier(dummy, dummy_ability, 'modifier_dummy_thinker', nil);
    return dummy;
end