<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

// TODO Use alternative API as fallback
// TODO Perhaps implement a better font

const oficial = ref(0);
const blue = ref(0);
const bolsa = ref(0);
const contadoConLiqui = ref(0);
const mayorista = ref(0);
const cripto = ref(0);
const tarjeta = ref(0);

function getValues() {
    axios.get("https://dolarapi.com/v1/dolares")
        .then(response => {
            oficial.value = response.data[0].venta;
            blue.value = response.data[1].venta;
            bolsa.value = response.data[2].venta;
            contadoConLiqui.value = response.data[3].venta;
            mayorista.value = response.data[4].venta;
            cripto.value = response.data[5].venta;
            tarjeta.value = response.data[6].venta;
        })
        .catch(error => {
            console.error(error);
        });
}

onMounted(() => {
    getValues();
})
</script>

<template>
    <div id="dollar-container">
        <div id="oficial-container" class="exchange-container">
            <h2 id="oficial-header" class="exchange-title">Oficial</h2>
            <h4 v-if="oficial > 0" class="exchange-value">${{ oficial }} </h4>
        </div>
        <div id="blue-container" class="exchange-container">
            <h2 id="blue-header" class="exchange-title">Blue</h2>
            <h4 v-if="blue > 0" class="exchange-value">${{ blue }}</h4>
        </div>
        <div id="bolsa-container" class="exchange-container">
            <h2 id="bolsa-header" class="exchange-title">MEP</h2>
            <h4 v-if="bolsa > 0" class="exchange-value">${{ bolsa }}</h4>
        </div>
        <div id="ccl-container" class="exchange-container">
            <h2 id="contadoConLiqui-header" class="exchange-title">CCL</h2>
            <h4 v-if="contadoConLiqui > 0" class="exchange-value">${{ contadoConLiqui }}</h4>
        </div>
        <div id="mayorista-container" class="exchange-container">
            <h2 id="mayorista-header" class="exchange-title">Mayorista</h2>
            <h4 v-if="mayorista > 0" class="exchange-value">${{ mayorista }}</h4>
        </div>
        <div id="cripto-container" class="exchange-container">
            <h2 id="cripto-header" class="exchange-title">Cripto</h2>
            <h4 v-if="mayorista > 0" class="exchange-value">${{ cripto }}</h4>
        </div>
        <div id="tarjeta-container" class="exchange-container">
            <h2 id="tarjeta-header" class="exchange-title">Tarjeta</h2>
            <h4 v-if="mayorista > 0" class="exchange-value">${{ tarjeta }}</h4>
        </div>
    </div>
</template>

<style scoped>
#dollar-container{
    display: flex;
    flex-direction: row;
    text-align: center;
    position: absolute;
    left: 0;
    top: 0;
}

.exchange-container {
    padding: 0 10px;
    display: flex;
    flex-direction: column;
    justify-content: center;    
}

.exchange-value{
    font-size: 22px;
}

#oficial-container{
    color: #85BB65;
}

#blue-container{
    color: #2196F3
}

#bolsa-container{
    color: #9C27B0;
}

#ccl-container{
    color: #FF9800;
}

#mayorista-container{
    color: #607D8B;
}

#cripto-container{
    color: #00BCD4;
}

#tarjeta-container{
    color: #F44336;
}
</style>