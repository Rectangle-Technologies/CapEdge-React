import { useParams } from 'react-router'
import { showErrorSnackbar } from '../../../store/utils'
import { get } from '../../../utils/apiUtil'
import { useDispatch } from 'react-redux'
import { hideLoader, showLoader } from '../../../store/slices/loaderSlice'
import { useEffect, useState } from 'react'
import { Grid, Typography, Card, CardContent, CardHeader, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, TextField, Alert, Button } from '@mui/material'
import { formatDate } from '../../../utils/formatDate'

const SplitSecurity = () => {
    const { securityId } = useParams()
    const dispatch = useDispatch()
    const [data, setData] = useState(null)
    const [splitFrom, setSplitFrom] = useState('')
    const [splitTo, setSplitTo] = useState('')
    const [newQuantities, setNewQuantities] = useState({})
    const [validationErrors, setValidationErrors] = useState({})

    const validateHolding = (holdingIndex, holding) => {
        if (!splitFrom || !splitTo) return null
        
        const from = parseFloat(splitFrom)
        const to = parseFloat(splitTo)
        
        if (from <= 0 || to <= 0) return null
        
        const currentTotal = holding.entries.reduce((sum, entry) => sum + entry.quantity, 0)
        const expectedTotal = (currentTotal * to) / from
        
        const actualTotal = holding.entries.reduce((sum, entry, entryIndex) => {
            const newQty = parseFloat(newQuantities[`${holdingIndex}-${entryIndex}`]) || 0
            return sum + newQty
        }, 0)
        
        const tolerance = 0.0001 // Allow small floating point differences
        if (Math.abs(actualTotal - expectedTotal) > tolerance) {
            return { actualTotal, expectedTotal }
        }
        
        return null
    }

    const handleNewQuantityChange = (holdingIndex, entryIndex, value) => {
        setNewQuantities(prev => ({
            ...prev,
            [`${holdingIndex}-${entryIndex}`]: value
        }))
    }

    useEffect(() => {
        if (data?.holdings && splitFrom && splitTo) {
            const errors = {}
            data.holdings.forEach((holding, index) => {
                const error = validateHolding(index, holding)
                if (error) {
                    errors[index] = error
                }
            })
            setValidationErrors(errors)
        } else {
            setValidationErrors({})
        }
    }, [newQuantities, splitFrom, splitTo, data])

    useEffect(() => {
        dispatch(showLoader())
        const fetchHoldings = async () => {
            try {
                const result = await get(`/holdings/for-split/${securityId}`)
                setData(result)
            } catch (error) {
                console.error('Error fetching holdings for security split:', error)
                showErrorSnackbar('Failed to fetch holdings for security split.')
            } finally {
                dispatch(hideLoader())
            }
        }

        fetchHoldings()
    }, [securityId])

    useEffect(() => {
        if (splitFrom && splitTo && data?.holdings) {
            const from = parseFloat(splitFrom)
            const to = parseFloat(splitTo)
            
            if (from > 0 && to > 0) {
                const calculatedQuantities = {}
                data.holdings.forEach((holding, holdingIndex) => {
                    holding.entries.forEach((entry, entryIndex) => {
                        const newQty = (entry.quantity * to) / from
                        calculatedQuantities[`${holdingIndex}-${entryIndex}`] = newQty.toString()
                    })
                })
                setNewQuantities(calculatedQuantities)
            }
        }
    }, [splitFrom, splitTo, data])

    return (
        <Box>
            <Typography variant="h3" sx={{ my: 3 }}>
                Split Security: {data?.securityName}
            </Typography>

            {data?.holdings?.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                    <Typography variant="h5" color="text.secondary">
                        No holdings found for this security
                    </Typography>
                </Box>
            ) : (
                <>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                        <Typography mr={2} variant="h5">Split Ratio</Typography>
                        <TextField
                            value={splitFrom}
                            onChange={(e) => setSplitFrom(e.target.value)}
                            type="number"
                            size="small"
                            sx={{ width: 60 }}
                        />
                        <Typography variant="h5">:</Typography>
                        <TextField
                            value={splitTo}
                            onChange={(e) => setSplitTo(e.target.value)}
                            type="number"
                            size="small"
                            sx={{ width: 60 }}
                        />
                    </Box>

                    <Grid container spacing={3}>
                    {data?.holdings?.map((holding, index) => (
                        <Grid item size={12} key={index}>
                            <Card>
                                <CardHeader 
                                    title={holding.title}
                                    titleTypographyProps={{ variant: 'h5' }}
                                />
                                <CardContent>
                                    <TableContainer component={Paper} variant="outlined">
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell><strong>Date</strong></TableCell>
                                                    <TableCell align="center"><strong>Current Quantity</strong></TableCell>
                                                    <TableCell align="center"><strong>New Quantity</strong></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {holding.entries.map((entry, entryIndex) => (
                                                    <TableRow key={entryIndex} sx={{ backgroundColor: entryIndex % 2 === 1 ? 'rgba(0, 0, 0, 0.02)' : 'inherit' }}>
                                                        <TableCell>{formatDate(entry.buyDate)}</TableCell>
                                                        <TableCell align="center">{entry.quantity}</TableCell>
                                                        <TableCell align="center">
                                                            <TextField
                                                                value={newQuantities[`${index}-${entryIndex}`] || ''}
                                                                onChange={(e) => handleNewQuantityChange(index, entryIndex, e.target.value)}
                                                                type="number"
                                                                size="small"
                                                                sx={{ width: 100 }}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                                                    <TableCell><strong>Total</strong></TableCell>
                                                    <TableCell align="center">
                                                        <strong>
                                                            {holding.entries.reduce((sum, entry) => sum + entry.quantity, 0)}
                                                        </strong>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <strong>
                                                            {holding.entries.reduce((sum, entry, entryIndex) => {
                                                                const newQty = parseFloat(newQuantities[`${index}-${entryIndex}`]) || 0
                                                                return sum + newQty
                                                            }, 0)}
                                                        </strong>
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                    {validationErrors[index] && (
                                        <Alert severity="error" sx={{ mt: 2 }}>
                                            Total mismatch: Expected {validationErrors[index].expectedTotal}, but got {validationErrors[index].actualTotal}
                                        </Alert>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                    <Button 
                        variant="contained" 
                        size="large"
                        disabled={Object.keys(validationErrors).length > 0 || !splitFrom || !splitTo}
                    >
                        Submit
                    </Button>
                </Box>
                </>
            )}
        </Box>
    )
}

export default SplitSecurity