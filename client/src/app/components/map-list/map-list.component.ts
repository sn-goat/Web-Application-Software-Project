import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AlertComponent } from '@app/components/common/alert/alert.component';
import { HeaderBarComponent } from '@app/components/common/header-bar/header-bar.component';
import { FormDialogComponent } from '@app/components/form-dialog/form-dialog.component';
import { MapCardComponent } from '@app/components/map-card/map-card.component';
import { Alert } from '@app/constants/enums';
import { LOADING_INTERVAL } from '@app/constants/magic-numbers';
import { BoardService } from '@app/services/board/board.service';
import { GameMapService } from '@app/services/game-map/game-map.service';
import { MapService } from '@app/services/map/map.service';
import { Board } from '@common/board';
import { Visibility } from '@common/enums';
import { firstValueFrom } from 'rxjs';

type SortingCategories = 'updatedAt' | 'createdAt' | 'name' | 'size';

@Component({
    selector: 'app-map-list',
    templateUrl: './map-list.component.html',
    styleUrls: ['./map-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, FormsModule, MapCardComponent, HeaderBarComponent],
})
export class MapListComponent implements OnInit {
    @Input() items: Board[] = [];
    @Input() isCreationPage: boolean = false;
    @Input() onlyVisible: boolean = false;
    @Output() divClicked = new EventEmitter<void>();
    isLoading: boolean = true;
    mapsLoaded: boolean = false;
    loadingInterval = LOADING_INTERVAL;
    searchQuery: string = '';
    sortBy: SortingCategories = 'updatedAt';

    private readonly mapService = inject(MapService);
    private readonly router: Router = inject(Router);
    private readonly cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
    private readonly dialog: MatDialog = inject(MatDialog);
    private readonly boardService: BoardService = inject(BoardService);
    private readonly gameMapService: GameMapService = inject(GameMapService);

    onDivClick(map: Board): void {
        this.boardService.getAllBoards().subscribe(async (serverMaps) => {
            const serverMap = serverMaps.find((m) => m._id === map._id);
            if (this.isCreationPage) {
                if (!serverMap) {
                    await this.warning('La carte a été supprimée du serveur.');
                } else if (!this.areMapsEqual(map, serverMap)) {
                    await this.warning('Les informations du jeu ont changé sur le serveur. La page va être rechargée.');
                } else {
                    this.divClicked.emit();
                    this.gameMapService.setGameMap(map);
                }
            }
        });
    }

    ngOnInit(): void {
        this.boardService.getAllBoards().subscribe((boards) => {
            this.items = boards.map((item) => ({
                ...item,
                updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
                createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
            }));

            this.mapsLoaded = this.items.length > 0;
            this.isLoading = false;
            this.cdr.detectChanges();
        });
    }

    isAllMapsHidden(): boolean {
        return this.isCreationPage && this.items.every((map) => map.visibility !== Visibility.Public);
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
                    return (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0);
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
            this.router.navigate(['/edition']);
        });
    }

    onDelete(map: Board): void {
        this.boardService.deleteBoardByName(map.name).subscribe(() => {
            this.items = this.items.filter((item) => item._id !== map._id);
            this.cdr.detectChanges();
        });
    }

    toggleVisibility(map: Board): void {
        this.boardService.toggleVisibility(map.name).subscribe(() => {
            map.visibility = map.visibility === Visibility.Public ? Visibility.Private : Visibility.Public;
            this.cdr.detectChanges();
        });
    }

    createNewMap(): void {
        const dialogRef = this.dialog.open(FormDialogComponent, {
            data: { name: '', description: '', size: 10, isCTF: false },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.mapService.setMapData(result);
                this.router.navigate(['/edition']);
            }
        });
    }

    handleImageError(event: Event): void {
        const target = event.target as HTMLImageElement;
        target.src = 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba';
    }

    async warning(message: string): Promise<void> {
        await this.openDialog(message, Alert.WARNING);
        window.location.reload();
    }

    private async openDialog(message: string, type: Alert): Promise<boolean> {
        const dialogRef = this.dialog.open(AlertComponent, {
            data: { type, message },
            disableClose: true,
            hasBackdrop: true,
            backdropClass: 'backdrop-block',
            panelClass: 'alert-dialog',
        });
        return firstValueFrom(dialogRef.afterClosed());
    }
}
