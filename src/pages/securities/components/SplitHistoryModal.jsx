import { Dialog, DialogTitle, DialogContent, Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper, IconButton } from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'

const SplitHistoryModal = ({ open, onClose, security }) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            slotProps={{
                paper: {
                    sx: {
                        position: 'fixed',
                        top: '30%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        margin: 0
                    }
                }
            }}
        >
            <DialogTitle variant='h4' sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Split History of {security?.name}
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <TableContainer component={Paper} sx={{ mt: 2.5 }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell align="center"><strong>Date</strong></TableCell>
                                <TableCell align="center"><strong>Split Ratio</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {security?.splitHistory?.length > 0 ? (
                                security.splitHistory.map((split) => (
                                    <TableRow key={split._id}>
                                        <TableCell align="center">
                                            {new Date(split.splitDate).toLocaleDateString('en-GB')}
                                        </TableCell>
                                        <TableCell align="center">{split.splitRatio}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={2} align="center">
                                        No split history available
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>
        </Dialog>
    )
}

export default SplitHistoryModal