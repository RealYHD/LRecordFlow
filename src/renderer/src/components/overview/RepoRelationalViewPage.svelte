<script lang="ts">
  import { route } from '../../lib/router.svelte'
  import { DataTable } from 'simple-datatables'
  import { findColumns, loadRecords } from '../../lib/repo.svelte'

  const tableOptions = {
    tableRender: (_data: [], _table, _type: string) => {
      if (_type === 'print') {
        return _table
      }

      const tHead = _table.childNodes[0]
      const filterHeaders = {
        nodeName: 'TR',
        attributes: {
          class: 'search-filtering-row'
        },
        childNodes: tHead.childNodes[0].childNodes.map((_th, index: number) => ({
          nodeName: 'TH',
          childNodes: [
            {
              nodeName: 'INPUT',
              attributes: {
                class: 'datatable-input',
                type: 'search',
                placeholder: 'Filter',
                'data-columns': `[${index}]`
              }
            }
          ]
        }))
      }

      tHead.childNodes.push(filterHeaders)
      return _table
    }
  }

  let table: HTMLTableElement
  let dataTable: DataTable = $derived(new DataTable(table, tableOptions))
  loadRecords(route.params.repository).then((records) => {
    findColumns(records).then((columns) => {
      console.log(columns)
      for (const columnName in columns) {
        if (!Object.hasOwn(columns, columnName)) continue
        const columnValues = columns[columnName]
        dataTable.columns.add({
          heading: columnName,
          type: 'string',
          data: columnValues
        })
      }
      for (const record of records) {
        for (const columnName in columns) {
          if (!Object.hasOwn(columns, columnName)) continue
          if (!Object.hasOwn(record, columnName)) record[columnName] = 'N/A'
        }
        console.log(record)
      }
      dataTable.insert(records)
    })
  })
</script>

<div>
  <table bind:this={table} class="w-full"></table>
</div>

<style>
</style>
