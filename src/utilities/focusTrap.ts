
import { onMounted, onBeforeUnmount, Ref } from "vue";

/**
 * Traps keyboard focus within the given element (e.g., a modal).
 * Usage: useFocusTrap(modalRef)
 */
export function useFocusTrap(containerRef: Ref<HTMLElement | null>) {
    function handleKeydown(e: KeyboardEvent) {
        if (e.key !== "Tab" || !containerRef.value) return;

        const focusableSelectors = [
            'a[href]',
            'area[href]',
            'input:not([disabled]):not([type="hidden"])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            'button:not([disabled])',
            'iframe',
            'object',
            'embed',
            '[tabindex]:not([tabindex="-1"])',
            '[contenteditable]'
        ];
        const focusableEls = Array.from(
            containerRef.value.querySelectorAll<HTMLElement>(focusableSelectors.join(","))
        ).filter(el => el.offsetParent !== null);

        if (focusableEls.length === 0) return;

        const firstEl = focusableEls[0];
        const lastEl = focusableEls[focusableEls.length - 1];
        const activeEl = document.activeElement as HTMLElement;

        if (!e.shiftKey && activeEl === lastEl) {
            e.preventDefault();
            firstEl.focus();
        } else if (e.shiftKey && activeEl === firstEl) {
            e.preventDefault();
            lastEl.focus();
        }
    }

    onMounted(() => {
        document.addEventListener("keydown", handleKeydown, true);
    });

    onBeforeUnmount(() => {
        document.removeEventListener("keydown", handleKeydown, true);
    });
}