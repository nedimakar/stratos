import { getCFEntityKey } from '../../../cloud-foundry/src/cf-entity-helpers';
import { IOrganization } from '../../../core/src/core/cf-api.types';
import { IRequestEntityTypeState } from '../app-state';
import { APIResource, NormalizedResponse } from '../types/api.types';
import { APISuccessOrFailedAction } from '../types/request.types';

type entityOrgType = APIResource<IOrganization<string[]>>;
export function updateOrganizationQuotaReducer(
  state: IRequestEntityTypeState<entityOrgType>,
  action: APISuccessOrFailedAction<NormalizedResponse>
) {
  switch (action.type) {
    case '[Organizations] Update Org success':
      const response = action.response;
      const entityKey = getCFEntityKey(action.apiAction.entityType);
      const newOrg = response.entities[entityKey][response.result[0]];
      const quotaDefinitionGuid = newOrg.entity.quota_definition_guid;
      const org = state[newOrg.metadata.guid];
      return applyQuotaDefinition(state, org, quotaDefinitionGuid);
  }
  return state;
}

function applyQuotaDefinition(
  state: IRequestEntityTypeState<entityOrgType>,
  org: entityOrgType,
  quotaDefinitionGuid: string
) {
  return {
    ...state,
    [org.metadata.guid]: {
      ...org,
      entity: {
        ...org.entity,
        quota_definition: quotaDefinitionGuid
      },
    },
  };
}
