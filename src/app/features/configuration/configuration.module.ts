import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { ConfigurationRoutingModule } from './configuration-routing.module';

// Components
import { SetupWizardComponent } from './components/setup-wizard/setup-wizard.component';
import { SettingsComponent } from './components/settings/settings.component';

// Step Components
import { WelcomeStepComponent } from './components/steps/welcome-step/welcome-step.component';
import { ApiKeyStepComponent } from './components/steps/api-key-step/api-key-step.component';
import { WorkspaceStepComponent } from './components/steps/workspace-step/workspace-step.component';
import { BundeslandStepComponent } from './components/steps/bundesland-step/bundesland-step.component';
import { WorkSettingsStepComponent } from './components/steps/work-settings-step/work-settings-step.component';

// Shared components
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@NgModule({
  imports: [
    SharedModule,
    ConfigurationRoutingModule,
    SetupWizardComponent,
    SettingsComponent,
    WelcomeStepComponent,
    ApiKeyStepComponent,
    WorkspaceStepComponent,
    BundeslandStepComponent,
    WorkSettingsStepComponent,
    LoadingSpinnerComponent,
    ErrorMessageComponent,
    PageHeaderComponent,
  ],
})
export class ConfigurationModule {}
