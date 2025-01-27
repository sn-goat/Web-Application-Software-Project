import { provideHttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Routes, provideRouter, withHashLocation } from '@angular/router';
import { AppComponent } from '@app/pages/app/app.component';
import { CreatePageComponent } from '@app/pages/create-page/create-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { EditPageComponent } from '@app/pages/edit-page/edit-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { MaterialPageComponent } from '@app/pages/material-page/material-page.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AdminPageComponent } from '@app/pages/admin-page/admin-page.component';
import { AttentePageComponent } from '@app/pages/attente-page/attente-page.component';



Component({
    template: `
     <div></div>
    `
})

const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: MainPageComponent },
    { path: 'creation', component: CreatePageComponent },
    { path: 'game', component: GamePageComponent },
    { path: 'material', component: MaterialPageComponent },
    { path: 'edit', component: EditPageComponent },
    { path: 'creation', component: CreatePageComponent  },
    { path: 'attente', component: AttentePageComponent  },
    { path: 'admin', component: AdminPageComponent },
    { path: '**', redirectTo: '/home' },
];

bootstrapApplication(AppComponent, {
    providers: [provideHttpClient(), provideRouter(routes, withHashLocation()), provideAnimations(), provideAnimationsAsync(), provideAnimationsAsync()],
})
