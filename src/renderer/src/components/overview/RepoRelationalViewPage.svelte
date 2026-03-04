<script lang="ts">
  import { route } from '../../lib/router'
  import { DataTable } from 'simple-datatables'
  import { findColumns, loadRecords } from '../../lib/repo'

  const tableOptions = {
    tableRender: (_data: [], table, type: string) => {
      if (type === 'print') {
        return table
      }

      const tHead = table.childNodes[0]
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
      return table
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

<div class="px-4">
  <table bind:this={table}></table>
</div>
