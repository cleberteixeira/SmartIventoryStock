import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

// Registra os dados de localização do português para o Angular
registerLocaleData(localePt);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));