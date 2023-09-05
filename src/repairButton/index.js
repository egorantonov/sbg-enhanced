import { Nodes } from '../constants'

export const RepairButton = () => {
  const repair = Nodes.GetId('repair')
  if (repair) {
    repair.id = 'eui-repair'
    repair.disabled = false
  }
}