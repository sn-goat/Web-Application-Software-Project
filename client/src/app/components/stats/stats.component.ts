import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { GameService } from '@app/services/game/game.service';
import { PlayerStats } from '@common/player';
import { Stats } from '@common/stats';
import { Subscription } from 'rxjs';
// import { mockCTFStats } from '@app/components/stats/stats.mock';

type StatPlayer = PlayerStats & { isDisconnected: boolean };

@Component({
    selector: 'app-stats',
    standalone: true,
    imports: [CommonModule, MatTableModule, MatSortModule, MatCardModule, MatDividerModule, MatChipsModule],
    templateUrl: './stats.component.html',
    styleUrls: ['./stats.component.scss'],
})
export class StatsComponent implements OnDestroy, OnInit {
    stats: Stats | null = null;
    dataSource: MatTableDataSource<StatPlayer> = new MatTableDataSource();
    displayedColumns: string[] = [
        'name',
        'wins',
        'losses',
        'totalFights',
        'givenDamage',
        'takenDamage',
        'itemsPickedCount',
        'tilesVisitedPercentage',
        'fleeSuccess',
    ];

    private readonly gameService: GameService = inject(GameService);
    private subscriptions: Subscription[] = [];

    ngOnInit() {
        /* this.stats = mockCTFStats;
        const _allPlayerStats = [
            ...this.stats.playersStats.map((player) => ({ ...player, isDisconnected: false })),
            ...this.stats.disconnectedPlayersStats.map((player) => ({ ...player, isDisconnected: true })),
        ];
        this.dataSource = new MatTableDataSource(_allPlayerStats);
        */

        this.subscriptions.push(
            this.gameService.stats.subscribe((stats: Stats | null) => {
                if (!stats) {
                    return;
                }
                this.stats = stats;

                const allPlayerStats = [
                    ...stats.playersStats.map((player) => ({ ...player, isDisconnected: false })),
                    ...stats.disconnectedPlayersStats.map((player) => ({ ...player, isDisconnected: true })),
                ];

                this.dataSource = new MatTableDataSource(allPlayerStats);
            }),
        );
    }

    ngOnDestroy() {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }

    sortData(sort: Sort) {
        const data = this.dataSource.data.slice();
        if (!sort.active || sort.direction === '') {
            this.dataSource.data = data;
            return;
        }

        this.dataSource.data = data.sort((a, b) => {
            return this.compareByColumn(a, b, sort.active, sort.direction === 'asc');
        });
    }

    private compareByColumn(a: StatPlayer, b: StatPlayer, column: string, isAsc: boolean): number {
        if (column === 'name') {
            return this.compare(a.name, b.name, isAsc);
        }

        if (['wins', 'losses', 'givenDamage', 'takenDamage', 'fleeSuccess'].includes(column)) {
            return this.compareNumericProperty(a, b, column as keyof StatPlayer, isAsc);
        }

        switch (column) {
            case 'itemsPickedCount':
                return this.compare(a.itemsPickedCount ?? 0, b.itemsPickedCount ?? 0, isAsc);
            case 'totalFights':
                return this.compare(a.totalFights ?? 0, b.totalFights ?? 0, isAsc);
            case 'tilesVisitedPercentage':
                return this.compare(
                    this.parsePercentage(a.tilesVisitedPercentage ?? '0%'),
                    this.parsePercentage(b.tilesVisitedPercentage ?? '0%'),
                    isAsc,
                );
            default:
                return 0;
        }
    }

    private compareNumericProperty(a: StatPlayer, b: StatPlayer, property: keyof StatPlayer, isAsc: boolean): number {
        return this.compare(a[property] as number, b[property] as number, isAsc);
    }

    private compare(a: number | string, b: number | string, isAsc: boolean) {
        return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
    }

    private parsePercentage(value: string): number {
        if (!value) return 0;
        return parseFloat(value.replace('%', ''));
    }
}
