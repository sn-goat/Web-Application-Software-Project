import { provideHttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { Routes, provideRouter, withHashLocation } from '@angular/router';
import { AdminPageComponent } from '@app/pages/admin-page/admin-page.component';
import { AppComponent } from '@app/pages/app/app.component';
import { CreatePageComponent } from '@app/pages/create-page/create-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { JoinRoomComponent } from '@app/pages/joinRoom-page/join-room.component';
import { LobbyComponent } from '@app/pages/lobby-page/lobby.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { MapMakerComponent } from '@app/pages/edit-page/map-maker.component';

Component({
    template: `
     <div></div>
    `,
});

const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: MainPageComponent },
    { path: 'creation', component: CreatePageComponent },
    { path: 'edit', component: MapMakerComponent },
    { path: 'game', component: GamePageComponent },
    { path: 'lobby', component: LobbyComponent },
    { path: 'joinGame', component: JoinRoomComponent },
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
