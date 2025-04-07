import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Entry } from '@common/journal';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player/player.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-journal',
    imports: [],
    templateUrl: './journal.component.html',
    styleUrl: './journal.component.scss',
})
export class JournalComponent implements OnDestroy, OnInit {
    journalEntries: Entry[] = [];
    isFilterActive: boolean = false;
    myPlayerId: string = '';
    private readonly gameService: GameService = inject(GameService);
    private readonly playerService: PlayerService = inject(PlayerService);
    private subscriptions: Subscription[] = [];

    ngOnInit() {
        this.subscriptions.push(
            this.gameService.journalEntries.subscribe((entries: Entry[]) => {
                this.journalEntries = entries;
            }),
            this.playerService.myPlayer.subscribe((player) => {
                if (player) {
                    this.myPlayerId = player.id;
                }
            }),
        );
    }

    ngOnDestroy() {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }

    toggleFilter() {
        this.isFilterActive = !this.isFilterActive;
    }

    shouldDisplayEntry(journalEntry: Entry): boolean {
        if (this.isFilterActive) {
            return journalEntry.playersInvolved.includes(this.myPlayerId);
        } else {
            return true;
        }
    }
}
