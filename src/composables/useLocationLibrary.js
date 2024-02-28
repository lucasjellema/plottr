
export function useLocationLibrary() {
    // Function to map resolution to zoom level
    function mapResolutionToZoom(resolution) {
        switch (resolution) {
            case 0:
                return 16;
            case 1:
                return 12;
            case 2:
                return 7;
            case 3:
                return 5;
            case 4:
                return 3;
            case 5:
                return 0;
            default:
                return 10;
        }
    }

    

    return { mapResolutionToZoom };
}
