<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

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
    <div v-if="isVisible" class="confirmation-dialog">
        <div class="dialog-content">
            <p>{{ message }}</p>
            <div>
                <button class="btn btn-primary" @click="confirm">Si</button>
                <button class="btn btn-danger" @click="cancel">Cancelar</button>
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
}

.btn {
    margin: 0 10px;
}

.dialog-content {
    background-color: #2f2f2f;
    padding: 20px;
    border-radius: 5px;
    text-align: center;
}
</style>