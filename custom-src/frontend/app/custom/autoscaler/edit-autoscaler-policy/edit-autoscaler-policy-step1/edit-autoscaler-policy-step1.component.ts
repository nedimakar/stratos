import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material';
import { Store } from '@ngrx/store';
import * as moment from 'moment-timezone';
import { Observable, of as observableOf, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { AppState } from '../../../../../../store/src/app-state';
import { entityFactory } from '../../../../../../store/src/helpers/entity-factory';
import { EntityService } from '../../../../core/entity-service';
import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { ApplicationService } from '../../../../features/applications/application.service';
import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { GetAppAutoscalerPolicyAction } from '../../app-autoscaler.actions';
import { AppAutoscalerPolicy } from '../../app-autoscaler.types';
import { autoscalerTransformArrayToMap } from '../../autoscaler-helpers/autoscaler-transform-policy';
import { PolicyAlert, PolicyDefault } from '../../autoscaler-helpers/autoscaler-util';
import { numberWithFractionOrExceedRange } from '../../autoscaler-helpers/autoscaler-validation';
import { appAutoscalerPolicySchemaKey } from '../../autoscaler.store.module';

@Component({
  selector: 'app-edit-autoscaler-policy-step1',
  templateUrl: './edit-autoscaler-policy-step1.component.html',
  styleUrls: ['./edit-autoscaler-policy-step1.component.scss'],
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }
  ]
})
export class EditAutoscalerPolicyStep1Component implements OnInit, OnDestroy {

  policyAlert = PolicyAlert;
  timezoneOptions = moment.tz.names();
  editLimitForm: FormGroup;
  appAutoscalerPolicy$: Observable<AppAutoscalerPolicy>;

  private editLimitValid = true;
  private appAutoscalerPolicyErrorSub: Subscription;
  private appAutoscalerPolicyService: EntityService;
  private currentPolicy: AppAutoscalerPolicy;

  constructor(
    public applicationService: ApplicationService,
    private store: Store<AppState>,
    private fb: FormBuilder,
    private entityServiceFactory: EntityServiceFactory,
  ) {
    this.editLimitForm = this.fb.group({
      instance_min_count: [0, [Validators.required, this.validateGlobalLimitMin()]],
      instance_max_count: [0, [Validators.required, this.validateGlobalLimitMax()]],
      timezone: [0, [Validators.required]]
    });
  }

  ngOnInit() {
    this.appAutoscalerPolicyService = this.entityServiceFactory.create(
      appAutoscalerPolicySchemaKey,
      entityFactory(appAutoscalerPolicySchemaKey),
      this.applicationService.appGuid,
      new GetAppAutoscalerPolicyAction(this.applicationService.appGuid, this.applicationService.cfGuid),
      false
    );
    this.appAutoscalerPolicy$ = this.appAutoscalerPolicyService.entityObs$.pipe(
      filter(({ entityRequestInfo }) => entityRequestInfo && entityRequestInfo.fetching === false),
      map(({ entity }) => {
        if (entity && entity.entity) {
          this.currentPolicy = entity.entity;
        } else {
          this.currentPolicy = PolicyDefault;
        }
        if (!this.currentPolicy.scaling_rules_form) {
          this.currentPolicy = autoscalerTransformArrayToMap(this.currentPolicy);
        }
        this.editLimitForm.controls.timezone.setValue(this.currentPolicy.schedules.timezone);
        this.editLimitForm.controls.instance_min_count.setValue(this.currentPolicy.instance_min_count);
        this.editLimitForm.controls.instance_max_count.setValue(this.currentPolicy.instance_max_count);
        this.editLimitForm.controls.instance_min_count.setValidators([Validators.required, this.validateGlobalLimitMin()]);
        this.editLimitForm.controls.instance_max_count.setValidators([Validators.required, this.validateGlobalLimitMax()]);
        return this.currentPolicy;
      })
    );
  }

  ngOnDestroy(): void {
    if (this.appAutoscalerPolicyErrorSub) {
      this.appAutoscalerPolicyErrorSub.unsubscribe();
    }
  }

  finishLimit: StepOnNextFunction = () => {
    this.currentPolicy.instance_min_count = Math.floor(this.editLimitForm.get('instance_min_count').value);
    this.currentPolicy.instance_max_count = Math.floor(this.editLimitForm.get('instance_max_count').value);
    this.currentPolicy.schedules.timezone = this.editLimitForm.get('timezone').value;
    return observableOf({
      success: true,
      data: {
        ...this.currentPolicy
      }
    });
  }

  validateGlobalLimitMin(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      let invalid = false;
      if (this.editLimitForm) {
        invalid = numberWithFractionOrExceedRange(control.value, 1, this.editLimitForm.get('instance_max_count').value - 1, true);
      }
      const lastValid = this.editLimitValid;
      this.editLimitValid = this.editLimitForm && control.value < this.editLimitForm.get('instance_max_count').value;
      if (this.editLimitForm && this.editLimitValid !== lastValid) {
        this.editLimitForm.controls.instance_max_count.updateValueAndValidity();
      }
      return invalid ? { alertInvalidPolicyMinimumRange: { value: control.value } } : null;
    };
  }

  validateGlobalLimitMax(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      let invalid = false;
      if (this.editLimitForm) {
        invalid = numberWithFractionOrExceedRange(control.value,
          this.editLimitForm.get('instance_min_count').value + 1, Number.MAX_VALUE, true);
      }
      const lastValid = this.editLimitValid;
      this.editLimitValid = this.editLimitForm && this.editLimitForm.get('instance_min_count').value < control.value;
      if (this.editLimitForm && this.editLimitValid !== lastValid) {
        this.editLimitForm.controls.instance_min_count.updateValueAndValidity();
      }
      return invalid ? { alertInvalidPolicyMaximumRange: { value: control.value } } : null;
    };
  }
}
