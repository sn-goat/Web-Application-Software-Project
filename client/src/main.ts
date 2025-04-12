import { provideHttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { Routes, provideRouter, withHashLocation } from '@angular/router';
import { AdminPageComponent } from '@app/pages/admin-page/admin-page.component';
import { AppComponent } from '@app/pages/app/app.component';
import { CreatePageComponent } from '@app/pages/create-page/create-page.component';
import { MapMakerComponent } from '@app/pages/edit-page/map-maker.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { JoinRoomComponent } from '@app/pages/join-room-page/join-room.component';
import { LobbyComponent } from '@app/pages/lobby-page/lobby.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';

Component({
    template: `
     <div></div>
    `,
});

const routes: Routes = [
    { path: '', redirectTo: '/accueil', pathMatch: 'full' },
    { path: 'accueil', component: MainPageComponent },
    { path: 'creation', component: CreatePageComponent },
    { path: 'edition', component: MapMakerComponent },
    { path: 'jeu', component: GamePageComponent },
    { path: 'lobby', component: LobbyComponent },
    { path: 'joindre', component: JoinRoomComponent },
    { path: 'admin', component: AdminPageComponent },
    { path: '**', redirectTo: '/accueil' },
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
