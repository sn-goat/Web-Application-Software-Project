import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { SubLifecycleHandlerComponent } from '@app/components/common/sub-lifecycle-handler/subscription-lifecycle-handler.component';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player/player.service';
import { Entry } from '@common/journal';

@Component({
    selector: 'app-journal',
    imports: [],
    templateUrl: './journal.component.html',
    styleUrl: './journal.component.scss',
})
export class JournalComponent extends SubLifecycleHandlerComponent implements OnInit, OnDestroy {
    journalEntries: Set<Entry> = new Set<Entry>();
    isFilterActive: boolean = false;
    myPlayerId: string = '';
    currentDate: string;
    private readonly gameService: GameService = inject(GameService);
    private readonly playerService: PlayerService = inject(PlayerService);

    ngOnInit() {
        this.autoSubscribe(this.gameService.journalEntries, (entries: Set<Entry>) => {
            this.journalEntries = entries;
        });
        this.autoSubscribe(this.playerService.myPlayer, (player) => {
            if (player) {
                this.myPlayerId = player.id;
            }
        });
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
