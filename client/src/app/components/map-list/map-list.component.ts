import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FormDialogComponent } from '@app/components/form-dialog/form-dialog.component';
import { BoardGame } from '@app/interfaces/board/board-game';
import { BoardService } from '@app/services/board.service';
import { BoardVisibility } from '@common/enums';

@Component({
    selector: 'app-map-list',
    templateUrl: './map-list.component.html',
    styleUrls: ['./map-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CommonModule, FormsModule],
})
export class MapListComponent implements OnInit {
    @Input() items: BoardGame[] = [];
    @Input() showActions: boolean = true;
    @Input() onlyVisible: boolean = false;
    @Output() divClicked = new EventEmitter<void>();
    searchQuery: string = '';
    sortBy: string = 'createdAt';

    constructor(
        private readonly router: Router,
        private readonly cdr: ChangeDetectorRef,
        private readonly dialog: MatDialog,
        private readonly boardService: BoardService,
    ) {}

    onDivClick(map: BoardGame): void {
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
                status: item.status === 'Ongoing' ? 'Ongoing' : 'Completed',
                visibility: item.visibility === 'Public' ? 'Public' : 'Private',
                createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
                updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
            }));
            this.cdr.detectChanges(); // Manually trigger change detection
        });
    }

    getFilteredAndSortedItems(): BoardGame[] {
        let filtered = this.items.filter((item) => {
            const matchesSearch =
                item.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                item.description.toLowerCase().includes(this.searchQuery.toLowerCase());

            const isPublished = this.showActions || item.status === 'Completed';

            return matchesSearch && isPublished;
        });

        if (this.onlyVisible) {
            filtered = filtered.filter((item) => item.visibility === 'Public');
        }

        return filtered.sort((a, b) => {
            switch (this.sortBy) {
                case 'createdAt':
                    return (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0);
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

    areMapsEqual(localMap: BoardGame, serverMap: BoardGame): boolean {
        return (
            localMap.name === serverMap.name &&
            localMap.description === serverMap.description &&
            localMap.size === serverMap.size &&
            localMap.visibility === serverMap.visibility &&
            JSON.stringify(localMap.boardCells) === JSON.stringify(serverMap.boardCells)
        );
    }

    onEdit(map: BoardGame): void {
        this.router.navigate(['/edit'], { queryParams: { id: map._id } });
    }

    onDelete(map: BoardGame): void {
        if (confirm(`Are you sure you want to delete "${map.name}"?`)) {
            this.boardService.deleteBoardByName(map.name).subscribe(() => {
                this.items = this.items.filter((item) => item._id !== map._id);
                this.cdr.detectChanges();
            });
        }
    }

    toggleVisibility(map: BoardGame): void {
        this.boardService.toggleVisibility(map.name).subscribe(() => {
            map.visibility = map.visibility === BoardVisibility.PUBLIC ? BoardVisibility.PRIVATE : BoardVisibility.PUBLIC;
            this.cdr.detectChanges();
        });
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
