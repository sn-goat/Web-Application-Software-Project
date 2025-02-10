import { provideHttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { Routes, provideRouter, withHashLocation } from '@angular/router';
import { AdminPageComponent } from '@app/pages/admin-page/admin-page.component';
import { AppComponent } from '@app/pages/app/app.component';
import { WaitingPageComponent } from '@app/pages/attente-page/attente-page.component';
import { CreatePageComponent } from '@app/pages/create-page/create-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { MapMakerComponent } from '@app/pages/map-maker/map-maker.component';
import { MaterialPageComponent } from '@app/pages/material-page/material-page.component';

Component({
    template: `
     <div></div>
    `,
});

const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: MainPageComponent },
    { path: 'creation', component: CreatePageComponent },
    { path: 'material', component: MaterialPageComponent },
    { path: 'edit', component: MapMakerComponent },
    { path: 'attente', component: WaitingPageComponent },
    { path: 'admin', component: AdminPageComponent },
    { path: '**', redirectTo: '/home' },
];

bootstrapApplication(AppComponent, {
    providers: [
        provideHttpClient(),
        provideRouter(routes, withHashLocation()),
        provideAnimations(),
        provideAnimationsAsync(),
        provideAnimationsAsync(),
    ],
});
