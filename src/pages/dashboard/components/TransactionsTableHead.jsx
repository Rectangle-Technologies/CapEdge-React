import { TableCell, TableHead, TableRow } from '@mui/material';

const headCells = [
  {
    id: 'id',
    align: 'left',
    disablePadding: false,
    label: 'Id'
  },
  {
    id: 'reference_no',
    align: 'left',
    disablePadding: false,
    label: 'Reference No.'
  },
  {
    id: 'security',
    align: 'left',
    disablePadding: true,
    label: 'Security'
  },
  {
    id: 'date',
    align: 'center',
    disablePadding: false,
    label: 'Date'
  },
  {
    id: 'type',
    align: 'center',
    disablePadding: false,
    label: 'Type'
  },
  {
    id: 'delivery_type',
    align: 'center',
    disablePadding: false,
    label: 'Delivery Type'
  },
  {
    id: 'quantity',
    align: 'right',
    disablePadding: false,
    label: 'Quantity'
  },
  {
    id: 'price',
    align: 'right',
    disablePadding: false,
    label: 'Price'
  },
  {
    id: 'amount',
    align: 'right',
    disablePadding: false,
    label: 'Amount'
  },
  {
    id: 'transactionCost',
    align: 'right',
    disablePadding: false,
    label: 'Charges'
  },
  {
    id: 'actions',
    align: 'center',
    disablePadding: false,
    label: 'Actions'
  }
];

const TransactionsTableHead = () => {
  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell key={headCell.id} align={headCell.align} padding={headCell.disablePadding ? 'none' : 'normal'}>
            {headCell.label}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
};

export default TransactionsTableHead;
