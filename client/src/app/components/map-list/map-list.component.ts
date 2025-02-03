import { ScrollingModule, ViewportRuler } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FormDialogComponent } from '@app/components/form-dialog/form-dialog.component';
import { MapService } from '@app/services/map.service';

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
    @Input() items: GameMap[] = [];
    @Input() showActions: boolean = true;
    @Input() onlyVisible: boolean = false;
    @Output() divClicked = new EventEmitter<void>();
    searchQuery: string = '';
    sortBy: string = 'createdAt';

    constructor(
        private readonly router: Router,
        private readonly cdr: ChangeDetectorRef,
        private readonly dialog: MatDialog,
        private viewportRuler: ViewportRuler,
        private mapService: MapService,
    ) {}

    onDivClick() {
        this.divClicked.emit();
    }

    ngOnInit(): void {
        this.mapService.getAllMaps().subscribe((maps) => {
            this.items = maps.map((item) => ({
                ...item,
                status: item.status === 'Draft' ? BoardStatus.Draft : BoardStatus.Published,
                visibility: item.visibility === 'Public' ? BoardVisibility.Public : BoardVisibility.Private,
                createdAt: item.createdAt ? new Date(item.createdAt) : null,
                updatedAt: item.updatedAt ? new Date(item.updatedAt) : null,
            }));
            this.viewportRuler.change(1); // Force recalculation of viewport size
            this.cdr.detectChanges(); // Manually trigger change detection
        });
    }

    getFilteredAndSortedItems(): GameMap[] {
        let filtered = this.items.filter((item) => {
            const matchesSearch =
                item.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                item.description.toLowerCase().includes(this.searchQuery.toLowerCase());

            const isPublished = this.showActions || item.status === BoardStatus.Published;

            return matchesSearch && isPublished;
        });

        if (this.onlyVisible) {
            filtered = filtered.filter((item) => item.visibility === 'Public');
        }

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

    onEdit(map: GameMap): void {
        this.router.navigate(['/edit'], { queryParams: { id: map._id } });
    }

    onDelete(map: GameMap): void {
        if (confirm(`Are you sure you want to delete "${map.name}"?`)) {
            this.items = this.items.filter((item) => item._id !== map._id);
            this.cdr.detectChanges();
        }
    }

    toggleVisibility(map: GameMap): void {
        map.visibility = map.visibility === BoardVisibility.Public ? BoardVisibility.Private : BoardVisibility.Public;
        this.cdr.detectChanges();
    }

    createNewMap(): void {
        const dialogRef = this.dialog.open(FormDialogComponent, {
            width: '280px',
            data: { name: '', description: '', size: 10, category: '', isCTF: false },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.router.navigate(['/edit'], { queryParams: result });
            }
        });
    }

    handleImageError(event: Event): void {
        const target = event.target as HTMLImageElement;
        target.src = 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba';
    }
}
