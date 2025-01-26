import { ScrollingModule, ViewportRuler } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

enum BoardStatus {
    Draft = 'Draft',
    Published = 'Published',
}

enum BoardVisibility {
    Public = 'Public',
    Private = 'Private',
}

interface BoardCell {
    x: number;
    y: number;
    type: string;
}

export interface GameMap {
    _id: string;
    name: string;
    description: string;
    size: number;
    category: string;
    isCTF: boolean;
    board: BoardCell[][];
    status: BoardStatus;
    visibility: BoardVisibility;
    image: string | null;
    createdAt?: Date | null;
    updatedAt?: Date | null;
}

@Component({
    selector: 'app-map-list',
    templateUrl: './map-list.component.html',
    styleUrls: ['./map-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CommonModule, FormsModule, ScrollingModule],
})
export class MapListComponent implements OnInit {
    items: GameMap[] = [];
    searchQuery: string = '';
    sortBy: string = 'createdAt';

    constructor(
        private readonly http: HttpClient,
        private readonly viewportRuler: ViewportRuler,
        private readonly cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this.http.get<GameMap[]>('assets/mockMapData.json').subscribe({
            next: (data) => {
                this.items = data.map((item) => ({
                    ...item,
                    status: item.status === 'Draft' ? BoardStatus.Draft : BoardStatus.Published,
                    visibility: item.visibility === 'Public' ? BoardVisibility.Public : BoardVisibility.Private,
                    createdAt: item.createdAt ? new Date(item.createdAt) : null,
                    updatedAt: item.updatedAt ? new Date(item.updatedAt) : null,
                }));
                this.cdr.detectChanges(); // Manually trigger change detection
            },
        });

        setTimeout(() => {
            this.viewportRuler.change(1); // Force recalculation of viewport size
        }, 0);
    }

    getFilteredAndSortedItems(): GameMap[] {
        const filtered = this.items.filter(
            (item) =>
                item.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                item.description.toLowerCase().includes(this.searchQuery.toLowerCase()),
        );

        return filtered.sort((a, b) => {
            switch (this.sortBy) {
                case 'createdAt':
                    return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'status':
                    return a.status.localeCompare(b.status);
                case 'size':
                    return b.size - a.size;
                default:
                    return 0;
            }
        });
    }

    onEdit(item: GameMap): void {
        item.status = item.status === BoardStatus.Draft ? BoardStatus.Published : BoardStatus.Draft;
        this.cdr.detectChanges();
        // todo : envoyer editing info a db
    }

    onDelete(item: GameMap): void {
        if (confirm('Are you sure you want to delete this item?')) {
            this.items = this.items.filter((i) => i._id !== item._id);
            this.cdr.detectChanges();
        }
    }

    handleImageError(event: Event): void {
        const target = event.target as HTMLImageElement;
        target.src = 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba';
    }

    toggleVisibility(item: GameMap): void {
        item.visibility = item.visibility === BoardVisibility.Public ? BoardVisibility.Private : BoardVisibility.Public;
        this.cdr.detectChanges();
    }
}
