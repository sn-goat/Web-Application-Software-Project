const LOBBY_LIMITS: { [key: number]: number } = {
    [10]: 2,
    [15]: 4,
    [20]: 6,
};

export function getLobbyLimit(size: number): number {
    return LOBBY_LIMITS[size] || 0;
}
