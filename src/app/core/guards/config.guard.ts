import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { ConfigService } from '../services/config.service';
import { firstValueFrom } from 'rxjs';

/**
 * Guard to check if the app is configured before accessing protected routes
 * Redirects to setup wizard if not configured
 */
export const configGuard: CanActivateFn = async (route, state) => {
  const configService = inject(ConfigService);
  const router = inject(Router);

  try {
    // Config should already be loaded by AppComponent, but load it again to be safe
    await firstValueFrom(configService.loadConfig());
    const config = configService.getCurrentConfig();

    console.log('Config check:', {
      hasApiKey: !!config.clockify.api_key,
      hasWorkspaceId: !!config.clockify.workspace_id,
      hasBundesland: !!config.location.bundesland_code,
      apiKeyLength: config.clockify.api_key?.length || 0,
      workspaceId: config.clockify.workspace_id || 'none',
      bundeslandCode: config.location.bundesland_code || 'none'
    });

    // Check if API key and workspace are configured
    if (!config.clockify.api_key || config.clockify.api_key.trim() === '' ||
        !config.clockify.workspace_id || config.clockify.workspace_id.trim() === '') {
      console.log('App not configured (missing API key or workspace), redirecting to setup...');
      return router.createUrlTree(['/setup']);
    }

    // Check if bundesland is configured
    if (!config.location.bundesland_code || config.location.bundesland_code.trim() === '') {
      console.log('Location not configured (missing bundesland), redirecting to setup...');
      return router.createUrlTree(['/setup']);
    }

    console.log('Config check passed, allowing access to:', state.url);
    return true;
  } catch (error) {
    console.error('Error checking configuration:', error);
    return router.createUrlTree(['/setup']);
  }
};
