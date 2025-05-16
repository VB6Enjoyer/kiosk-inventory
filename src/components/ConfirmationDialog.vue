<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue';
import { useFocusTrap } from '../utilities/focusTrap';

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
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: "Roboto", Helvetica, sans-serif;
}

.dialog-content {
    background-color: #2f2f2f;
    padding: 20px;
    padding-top: 0;
    margin-top: 0;
    border-radius: 5px;
    text-align: center;
    user-select: none;
    position: relative;
    /* Added for absolute positioning of close button */
}

#message-container {
    width: 100%;
    margin-top: 25px;
    /* Add margin to avoid overlap with close button */
}

.btn {
    margin: 0 10px;
    transition: box-shadow 0.33s, background-color 0.33s;
}

.charging-btn {
    position: relative;
    overflow: hidden;
}

.charging-label {
    position: relative;
    z-index: 2;
}

.charging-bar {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background: rgba(0, 153, 255, 0.4);
    z-index: 1;
    transition: none;
    pointer-events: none;
}
</style>