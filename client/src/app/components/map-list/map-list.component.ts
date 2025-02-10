import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FormDialogComponent } from '@app/components/form-dialog/form-dialog.component';
import { BoardService } from '@app/services/code/board.service';
import { MapService } from '@app/services/code/map.service';
import { Board } from '@common/board';
import { Visibility } from '@common/enums';

@Component({
    selector: 'app-map-list',
    templateUrl: './map-list.component.html',
    styleUrls: ['./map-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CommonModule, FormsModule],
})
export class MapListComponent implements OnInit {
    @Input() items: Board[] = [];
    @Input() showActions: boolean = true;
    @Input() onlyVisible: boolean = false;
    @Output() divClicked = new EventEmitter<void>();
    searchQuery: string = '';
    sortBy: string = 'createdAt';

    private mapService = inject(MapService);

    constructor(
        private readonly router: Router,
        private readonly cdr: ChangeDetectorRef,
        private readonly dialog: MatDialog,
        private readonly boardService: BoardService,
    ) {}

    onDivClick(map: Board): void {
        this.boardService.getAllBoards().subscribe((serverMaps) => {
            const serverMap = serverMaps.find((m) => m._id === map._id);
            if (!serverMap) {
                alert('La carte a été supprimée du serveur.');
                window.location.reload();
            } else if (!this.areMapsEqual(map, serverMap)) {
                alert('Les informations du jeu ont changé sur le serveur. La page va être rechargée.');
                window.location.reload();
            } else {
                this.divClicked.emit();
            }
        });
    }

    ngOnInit(): void {
        this.boardService.getAllBoards().subscribe((boards) => {
            this.items = boards.map((item) => ({
                ...item,
                visibility: item.visibility === Visibility.PUBLIC ? Visibility.PUBLIC : Visibility.PRIVATE,
                lastUpdatedAt: item.lastUpdatedAt ? new Date(item.lastUpdatedAt) : null,
            }));
            this.cdr.detectChanges(); // Manually trigger change detection
        });
    }

    getFilteredAndSortedItems(): Board[] {
        let filtered = this.items.filter((item) => {
            const matchesSearch =
                item.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                item.description.toLowerCase().includes(this.searchQuery.toLowerCase());

            return matchesSearch;
        });

        if (this.onlyVisible) {
            filtered = filtered.filter((item) => item.visibility === 'Public');
        }

        return filtered.sort((a, b) => {
            switch (this.sortBy) {
                case 'createdAt':
                    return (b.lastUpdatedAt?.getTime() ?? 0) - (a.lastUpdatedAt?.getTime() ?? 0);
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'size':
                    return b.size - a.size;
                default:
                    return 0;
            }
        });
    }

    areMapsEqual(localMap: Board, serverMap: Board): boolean {
        return (
            localMap.name === serverMap.name &&
            localMap.description === serverMap.description &&
            localMap.size === serverMap.size &&
            localMap.visibility === serverMap.visibility &&
            JSON.stringify(localMap.board) === JSON.stringify(serverMap.board)
        );
    }

    onEdit(map: Board): void {
        this.boardService.getBoard(map.name).subscribe((fullMap) => {
            this.mapService.setMapData(fullMap);
            this.router.navigate(['/edit']);
        });
    }

    onDelete(map: Board): void {
        if (confirm(`Are you sure you want to delete "${map.name}"?`)) {
            this.boardService.deleteBoardByName(map.name).subscribe(() => {
                this.items = this.items.filter((item) => item._id !== map._id);
                this.cdr.detectChanges();
            });
        }
    }

    toggleVisibility(map: Board): void {
        this.boardService.toggleVisibility(map.name).subscribe(() => {
            map.visibility = map.visibility === Visibility.PUBLIC ? Visibility.PRIVATE : Visibility.PUBLIC;
            this.cdr.detectChanges();
        });
    }

    createNewMap(): void {
        const dialogRef = this.dialog.open(FormDialogComponent, {
            width: '280px',
            data: { name: '', description: '', size: 10, isCTF: false },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.mapService.setMapData(result);
                this.router.navigate(['/edit']);
            }
        });
    }

    handleImageError(event: Event): void {
        const target = event.target as HTMLImageElement;
        target.src = 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba';
    }
}
