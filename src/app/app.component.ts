import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfigService } from './core/services/config.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Clockify Overtime Tracker';

  constructor(
    private configService: ConfigService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    // Load configuration from disk on app startup
    this.configService.loadConfig().subscribe({
      next: () => {
        console.log('Configuration loaded successfully');
      },
      error: (error) => {
        console.warn('No configuration found or error loading config:', error);
      }
    });
  }
}
