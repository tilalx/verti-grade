<template>
    <div>
        <input
            type="file"
            ref="fileInput"
            style="display: none"
            @change="handleFileChange"
            accept="application/json"
            
        />
        <v-btn @click="openFilePicker" color="primary">Import Routes</v-btn>
    </div>
</template>

<script>
import { importJson } from '@/services/climbingRoutes';
export default {
    methods: {
        openFilePicker() {
            //open file explorer
            this.$refs.fileInput.click();
        },
        async handleFileChange(event) {
            const file = event.target.files[0];
            const reader = new FileReader();

            reader.onload = async () => {
                const importedRoutes = JSON.parse(reader.result);
                const response = await importJson(importedRoutes);
                alert(response.count + ' ' + response.message + 'routes imported successfully.');
                this.$emit('closed');
            };

            reader.readAsText(file);
        },
    },
};
</script>
