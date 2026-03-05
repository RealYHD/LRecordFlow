<script lang="ts">
  import { Heading, P, A, Mark, Secondary, Checkbox, Helper } from 'flowbite-svelte'
  
</script>

<section>
  <span>Metadata Value Enforcement</span>
  <Checkbox aria-describedby="require-metadata-checkbox">Require Metadata Keys</Checkbox>
  <Helper id="require-metadata-checkbox" class="ps-6"
    >Require that all records in this repository has a pre-determined set of metadata keys.</Helper
  >
  <Checkbox aria-describedby="helper-checkbox-text">Require Metadata</Checkbox>
  <Helper id="helper-checkbox-text" class="ps-6"
    >Require that all records in this repository has a pre-determined set of metadata keys.</Helper
  >
</section>
