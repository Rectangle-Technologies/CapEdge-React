import { Box, Chip, Grid, Pagination, Table, TableBody, TableCell, TableContainer, TableRow } from '@mui/material';
import MainCard from 'components/MainCard';
import TransactionsTableHead from './TransactionsTableHead';
import { formatCurrency } from '../../../utils/formatCurrency';
import { getTransactionTypeColor } from '../../securities/utils/helpers';
import { useState } from 'react';

// TODO: Fetch transactions data from backend
const transactions = [
  {
    "_id": "6723a1b2c3d4e5f6a7b8c9d9",
    "date": "2024-10-15T09:30:00.000Z",
    "type": "BUY",
    "quantity": 100,
    "price": 1250.75,
    "securityId": {
      "_id": "6723a1b2c3d4e5f6a7b8c9d0",
      "symbol": "RELIANCE",
      "companyName": "Reliance Industries Limited",
      "isin": "INE002A01018",
      "exchange": "NSE"
    },
    "deliveryType": "Delivery",
    "referenceNumber": "ORD2024101500123",
    "dematAccountId": {
      "_id": "6723a1b2c3d4e5f6a7b8c9d1",
      "userAccountId": "6723a1b2c3d4e5f6a7b8c9d5",
      "brokerId": {
        "_id": "6723a1b2c3d4e5f6a7b8c9d6",
        "name": "Zerodha",
        "code": "ZERODHA"
      },
      "balance": 150000.50
    },
    "financialYearId": "6723a1b2c3d4e5f6a7b8c9d2"
  },
  {
    "_id": "6723a1b2c3d4e5f6a7b8c9d9",
    "date": "2024-10-20T14:15:00.000Z",
    "type": "BUY",
    "quantity": 50,
    "buyPrice": 2850.50,
    "deliveryType": "Intraday",
    "referenceNumber": "ORD2024102000456",
    "securityId": {
      "_id": "6723a1b2c3d4e5f6a7b8c9d3",
      "symbol": "TCS",
      "companyName": "Tata Consultancy Services Limited",
      "isin": "INE467B01029",
      "exchange": "BSE"
    },
    "dematAccountId": {
      "_id": "6723a1b2c3d4e5f6a7b8c9d1",
      "userAccountId": "6723a1b2c3d4e5f6a7b8c9d5",
      "brokerId": {
        "_id": "6723a1b2c3d4e5f6a7b8c9d7",
        "name": "Upstox",
        "code": "UPSTOX"
      },
      "balance": 200000.00
    },
    "financialYearId": "6723a1b2c3d4e5f6a7b8c9d2"
  },
  {
    "_id": "6723a1b2c3d4e5f6a7b8c9d9",
    "date": "2024-10-25T11:45:00.000Z",
    "type": "SELL",
    "quantity": 75,
    "price": 1580.25,
    "securityId": {
      "_id": "6723a1b2c3d4e5f6a7b8c9d4",
      "symbol": "HDFCBANK",
      "companyName": "HDFC Bank Limited",
      "isin": "INE040A01034",
      "exchange": "NSE"
    },
    "deliveryType": "Delivery",
    "referenceNumber": "ORD2024102500789",
    "dematAccountId": {
      "_id": "6723a1b2c3d4e5f6a7b8c9d1",
      "userAccountId": "6723a1b2c3d4e5f6a7b8c9d5",
      "brokerId": {
        "_id": "6723a1b2c3d4e5f6a7b8c9d8",
        "name": "ICICI Direct",
        "code": "ICICI"
      },
      "balance": 175000.75
    },
    "financialYearId": "6723a1b2c3d4e5f6a7b8c9d2"
  }
]

const TransactionsTable = () => {
  const totalPages = 5; // TODO: Calculate based on total transactions
  const [page, setPage] = useState(1);
  return (
    <Grid size={12}>
      <MainCard content={false}>
        <Box>
          <TableContainer
            sx={{
              width: '100%',
              overflowX: 'auto',
              position: 'relative',
              display: 'block',
              maxWidth: '100%',
              '& td, & th': { whiteSpace: 'nowrap' }
            }}
          >
            <Table aria-labelledby="tableTitle">
              <TransactionsTableHead />
              <TableBody>
                {transactions.map((transaction, index) => {
                  var price;
                  if (transaction.deliveryType === 'Delivery') {
                    price = transaction.price;
                  } else {
                    if (transaction.type === 'BUY') {
                      price = transaction.buyPrice;
                    } else {
                      price = transaction.sellPrice;
                    }
                  }
                  const amount = transaction.quantity * price;
                  return (
                    <TableRow
                      hover
                      role="checkbox"
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                      key={index}
                    >
                      <TableCell>{transaction._id}</TableCell>
                      <TableCell>{transaction.referenceNumber}</TableCell>
                      <TableCell>{transaction.securityId.symbol}</TableCell>
                      <TableCell>{transaction.dematAccountId.brokerId.name}</TableCell>
                      <TableCell align='center'>{new Date(transaction.date).toLocaleDateString('en-GB')}</TableCell>
                      <TableCell align='center'>
                        <Chip
                          label={transaction.type}
                          color={getTransactionTypeColor(transaction.type)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align='center'>{transaction.deliveryType}</TableCell>
                      <TableCell align='right'>{transaction.quantity}</TableCell>
                      <TableCell align='right'>{formatCurrency(price)}</TableCell>
                      <TableCell align='right'>{formatCurrency(amount)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </MainCard>
      <Box width='100%' sx={{
        mt: 4,
        display: { xs: 'none', md: 'flex' },
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Pagination count={totalPages} onChange={(event, value) => setPage(value)} />
      </Box>
    </Grid>
  )
}

export default TransactionsTable