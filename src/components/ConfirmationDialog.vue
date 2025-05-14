<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue';
import { useFocusTrap } from '../utilities/focusTrap';

const modalRef = ref<HTMLElement | null>(null);
useFocusTrap(modalRef);

const props = defineProps({
    message: String,
    isVisible: Boolean
});

const emit = defineEmits(['confirm', 'cancel']);

function confirm() {
    emit('confirm');
}

function cancel() {
    emit('cancel');
}
</script>

<template>
    <div v-if="isVisible" class="confirmation-dialog" ref="modalRef">
        <div class="dialog-content">
            <p>{{ message }}</p>
            <div>
                <button id="cancel-button" class="btn btn-danger" @click="cancel">Cancelar</button>
                <button id="confirm-button" class="btn btn-primary" @click="confirm">Si</button>
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
    border-radius: 5px;
    text-align: center;
    user-select: none;
}

.btn {
    margin: 0 10px;
    transition: box-shadow 0.33s, background-color 0.33s;
}

#cancel-button:hover {
    box-shadow: 0 0 2px 0 #ad263b;
}

#confirm-button:hover {
    box-shadow: 0 0 2px 0 #195dca;
}
</style>