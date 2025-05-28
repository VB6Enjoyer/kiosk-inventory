<script setup lang="ts">
import { ref, defineProps, defineEmits, onMounted, onUnmounted } from 'vue';
import { useFocusTrap } from '../utilities/focusTrap';
import { useCurrentlyOpenModalStore } from '../stores/openModal';

const currentlyOpenModalStore = useCurrentlyOpenModalStore();
const modalRef = ref<HTMLElement | null>(null);
useFocusTrap(modalRef);

const props = defineProps({
    message: String,
    isVisible: Boolean,
    blueText: String,
    redText: String,
    isImporting: Boolean
});

let replaceHoldTimeout: any = null;
let chargingBarTimeout: any = null;
let chargingAnimationFrame: any = null;
const chargingProgress = ref(0);
const isCharging = ref(false);

const emit = defineEmits(['confirm', 'cancel', 'replace']);

function confirm() {
    emit('confirm');
}

function cancel() {
    emit('cancel');
}

function replace() {
    emit('replace');
}

function startReplaceHold() {
    isCharging.value = true;
    chargingProgress.value = 0;
    const totalDuration = 1500; // ms
    const chargingDuration = 1250; // ms (charging bar fills in this time)

    let startTime: number | null = null;

    function animateBar(now: number) {
        if (!startTime) startTime = now;
        const elapsed = now - startTime;
        if (elapsed < chargingDuration) {
            chargingProgress.value = Math.min(100, (elapsed / chargingDuration) * 100);
            chargingAnimationFrame = requestAnimationFrame(animateBar);
        } else {
            chargingProgress.value = 100;
            // Bar stays full for the remaining 250ms
        }
    }
    chargingAnimationFrame = requestAnimationFrame(animateBar);

    // After chargingDuration, bar is full, but we wait 250ms more before calling replace
    chargingBarTimeout = setTimeout(() => {
        chargingProgress.value = 100;
    }, chargingDuration);

    replaceHoldTimeout = setTimeout(() => {
        replace();
        isCharging.value = false;
        chargingProgress.value = 0;
        cleanupCharging();
    }, totalDuration);
}

function cancelReplaceHold() {
    if (replaceHoldTimeout) {
        clearTimeout(replaceHoldTimeout);
        replaceHoldTimeout = null;
    }
    if (chargingBarTimeout) {
        clearTimeout(chargingBarTimeout);
        chargingBarTimeout = null;
    }
    cleanupCharging();
    isCharging.value = false;
    chargingProgress.value = 0;
}

function cleanupCharging() {
    if (chargingAnimationFrame) {
        cancelAnimationFrame(chargingAnimationFrame);
        chargingAnimationFrame = null;
    }
}

onMounted(() => {
    currentlyOpenModalStore.setModalOpen();

    const handleKeydown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
            cancel();
        }

        if (event.key === "Enter") {
            // Only submit if the modal is open and focused
            if (!props.isImporting) confirm();
        }
    };
    window.addEventListener("keydown", handleKeydown);

    onUnmounted(() => {
        window.removeEventListener("keydown", handleKeydown);
        currentlyOpenModalStore.setModalClosed();
    });
});
</script>

<template>
    <div v-if="isVisible" class="confirmation-dialog" ref="modalRef">
        <div class="dialog-content">
            <div id="message-container">
                <p>{{ message }}</p>
            </div>
            <div>
                <!-- Cancel Button -->
                <button id="cancel-button" class="btn btn-danger" @click.prevent="cancel">
                    Cancelar
                </button>

                <button id="replace-button" class="btn btn-primary charging-btn"
                    title="Mantenga presionado para reemplazar todos los productos" v-if="isImporting"
                    @mousedown="startReplaceHold" @mouseup="cancelReplaceHold" @mouseleave="cancelReplaceHold">
                    <span class="charging-label">{{ redText }}</span>
                    <span class="charging-bar" v-if="isCharging" :style="{ width: chargingProgress + '%' }"></span>
                </button>

                <!-- Confirm Button -->
                <button id="confirm-button" class="btn" :class="isImporting ? 'btn-success' : 'btn-primary'"
                    @click.prevent="confirm">
                    {{ blueText }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.confirmation-dialog {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--confirmation-dialog-background-color);
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: "Roboto", Helvetica, sans-serif;
    padding: 20px;
    box-sizing: border-box;
}

.dialog-content {
    background-color: var(--modal-background-color);
    padding: clamp(15px, 4vw, 20px);
    padding-top: 0;
    margin-top: 0;
    border-radius: 5px;
    text-align: center;
    user-select: none;
    position: relative;
    /* Added for absolute positioning of close button */
    width: 100%;
    max-width: 500px;
    min-width: 280px;
    max-height: 90vh;
    overflow-y: auto;
    box-sizing: border-box;
}

#message-container {
    width: 100%;
    margin-top: clamp(20px, 5vw, 25px);
    /* Responsive margin */
    padding: 0 10px;
    /* Added padding for text */
}

#message-container p {
    font-size: clamp(0.9rem, 2.5vw, 1.1rem);
    line-height: 1.4;
    word-wrap: break-word;
}

.btn {
    margin: 0 10px;
    transition: box-shadow 0.33s, background-color 0.33s;
    padding: clamp(8px, 2vw, 8px) clamp(12px, 3vw, 16px);
    font-size: clamp(0.9rem, 2vw, 1rem);
    min-width: 80px;
    box-sizing: border-box;
}

.charging-btn {
    position: relative;
    overflow: hidden;
    min-width: 100px;
}

.charging-label {
    position: relative;
    z-index: 2;
    display: block;
}

.charging-bar {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background: var(--charging-bar-color);
    z-index: 1;
    transition: none;
    pointer-events: none;
}

/* Button container for better layout */
.dialog-content>div:last-child {
    display: flex;
    flex-wrap: wrap;
    /* Allow wrapping on small screens */
    justify-content: center;
    gap: 5px;
    /* Add gap between buttons */
    margin-top: clamp(15px, 4vw, 20px);
    /* Responsive top margin */
}

/* Added responsive media queries */
@media (max-width: 768px) {
    .confirmation-dialog {
        padding: 15px;
    }

    .dialog-content {
        padding: 15px;
        max-width: 80%;
    }

    .btn {
        margin: 5px;
        min-width: 90px;
    }

    .charging-btn {
        min-width: 110px;
    }

    #message-container {
        margin-top: 15px;
        padding: 0 5px;
    }
}

@media (max-height: 600px) {
    .dialog-content {
        max-height: 95vh;
        padding: 10px;
    }

    #message-container {
        margin-top: 10px;
    }

    .btn {
        padding: 8px 12px;
    }

    .dialog-content>div:last-child {
        margin-top: 10px;
    }
}

@media (max-height: 600px) {
    .dialog-content {
        max-height: 95vh;
        padding: 10px;
    }

    #message-container {
        margin-top: 10px;
    }

    .btn {
        padding: 8px 12px;
    }

    .dialog-content>div:last-child {
        margin-top: 10px;
    }
}

@media (max-width: 480px) {
    .confirmation-dialog {
        padding: 10px;
    }

    .dialog-content {
        padding: 12px;
        min-width: 260px;
    }

    .btn {
        padding: 8px 10px;
        font-size: 0.8rem;
        min-width: 70px;
    }

    .charging-btn {
        min-width: 90px;
    }

    .dialog-content>div:last-child {
        flex-direction: column;
        /* Stack buttons vertically on very small screens */
        align-items: center;
    }
}

@media (max-height: 500px) and (orientation: landscape) {
    .dialog-content {
        max-height: 98vh;
        padding: 8px;
    }

    #message-container {
        margin-top: 8px;
    }

    .btn {
        padding: 6px 10px;
    }

    .dialog-content>div:last-child {
        margin-top: 8px;
        flex-direction: row;
        /* Keep horizontal layout in landscape */
    }
}
</style>