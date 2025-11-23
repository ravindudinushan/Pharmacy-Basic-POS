import React, { useState } from 'react';
import { ShoppingCartIcon, PackageIcon, DollarSignIcon, AlertTriangleIcon, PlusIcon, MinusIcon, TrashIcon, EditIcon, PrinterIcon, XIcon, CheckIcon, SearchIcon } from 'lucide-react';
interface Item {
  id: string;
  name: string;
  price: number;
  stock: number;
  reorderLevel: number;
}
interface CartItem {
  itemId: string;
  quantity: number;
}
interface ReceiptData {
  date: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  paymentMethod: string;
  amountReceived?: number;
  change?: number;
}
const STARTER_ITEMS: Item[] = [{
  id: '1',
  name: 'Paracetamol 500mg',
  price: 5.99,
  stock: 150,
  reorderLevel: 50
}, {
  id: '2',
  name: 'Ibuprofen 200mg',
  price: 7.49,
  stock: 30,
  reorderLevel: 40
}, {
  id: '3',
  name: 'Vitamin C 1000mg',
  price: 12.99,
  stock: 80,
  reorderLevel: 30
}, {
  id: '4',
  name: 'Cough Syrup',
  price: 8.99,
  stock: 25,
  reorderLevel: 35
}, {
  id: '5',
  name: 'Hand Sanitizer 500ml',
  price: 4.99,
  stock: 200,
  reorderLevel: 60
}];
export function PharmacyPOS() {
  const [items, setItems] = useState<Item[]>(STARTER_ITEMS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [lastSaleAmount, setLastSaleAmount] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    price: '',
    stock: '',
    reorderLevel: ''
  });
  const [newItemForm, setNewItemForm] = useState({
    name: '',
    price: '',
    stock: '',
    reorderLevel: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [posSearchQuery, setPosSearchQuery] = useState('');
  const lowStockItems = items.filter(item => item.stock <= item.reorderLevel);
  const cartTotal = cart.reduce((sum, cartItem) => {
    const item = items.find(i => i.id === cartItem.itemId);
    return sum + (item ? item.price * cartItem.quantity : 0);
  }, 0);
  const addToCart = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item || item.stock === 0) return;
    const existingCartItem = cart.find(c => c.itemId === itemId);
    if (existingCartItem) {
      if (existingCartItem.quantity < item.stock) {
        setCart(cart.map(c => c.itemId === itemId ? {
          ...c,
          quantity: c.quantity + 1
        } : c));
      }
    } else {
      setCart([...cart, {
        itemId,
        quantity: 1
      }]);
    }
  };
  const updateCartQuantity = (itemId: string, delta: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    setCart(cart.map(c => {
      if (c.itemId === itemId) {
        const newQuantity = c.quantity + delta;
        if (newQuantity <= 0) return c;
        if (newQuantity > item.stock) return c;
        return {
          ...c,
          quantity: newQuantity
        };
      }
      return c;
    }));
  };
  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(c => c.itemId !== itemId));
  };
  const completePurchase = () => {
    if (paymentMethod === 'cash') {
      const received = parseFloat(cashReceived);
      if (isNaN(received) || received < cartTotal) return;
    }
    // Update inventory
    const updatedItems = items.map(item => {
      const cartItem = cart.find(c => c.itemId === item.id);
      if (cartItem) {
        return {
          ...item,
          stock: item.stock - cartItem.quantity
        };
      }
      return item;
    });
    setItems(updatedItems);
    // Generate receipt
    const receipt: ReceiptData = {
      date: new Date().toLocaleString(),
      items: cart.map(cartItem => {
        const item = items.find(i => i.id === cartItem.itemId)!;
        return {
          name: item.name,
          quantity: cartItem.quantity,
          price: item.price,
          total: item.price * cartItem.quantity
        };
      }),
      subtotal: cartTotal,
      paymentMethod: paymentMethod === 'cash' ? 'Cash' : 'Card'
    };
    if (paymentMethod === 'cash') {
      const received = parseFloat(cashReceived);
      receipt.amountReceived = received;
      receipt.change = received - cartTotal;
    }
    setReceiptData(receipt);
    setLastSaleAmount(cartTotal);
    setShowReceipt(true);
    setCart([]);
    setCashReceived('');
  };
  const addNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: Item = {
      id: Date.now().toString(),
      name: newItemForm.name,
      price: parseFloat(newItemForm.price),
      stock: parseInt(newItemForm.stock),
      reorderLevel: parseInt(newItemForm.reorderLevel)
    };
    setItems([...items, newItem]);
    setNewItemForm({
      name: '',
      price: '',
      stock: '',
      reorderLevel: ''
    });
  };
  const startEditing = (item: Item) => {
    setEditingItemId(item.id);
    setEditForm({
      name: item.name,
      price: item.price.toString(),
      stock: item.stock.toString(),
      reorderLevel: item.reorderLevel.toString()
    });
  };
  const saveEdit = () => {
    if (!editingItemId) return;
    setItems(items.map(item => {
      if (item.id === editingItemId) {
        return {
          ...item,
          name: editForm.name,
          price: parseFloat(editForm.price),
          stock: parseInt(editForm.stock),
          reorderLevel: parseInt(editForm.reorderLevel)
        };
      }
      return item;
    }));
    setEditingItemId(null);
  };
  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };
  const placeOrder = (itemId: string) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const orderQuantity = Math.max(item.reorderLevel * 2 - item.stock, item.reorderLevel);
        return {
          ...item,
          stock: item.stock + orderQuantity
        };
      }
      return item;
    }));
  };
  const printReceipt = () => {
    window.print();
  };
  const cashBalance = cashReceived ? parseFloat(cashReceived) - cartTotal : 0;
  const canCompletePurchase = cart.length > 0 && (paymentMethod === 'card' || paymentMethod === 'cash' && cashBalance >= 0);
  const filteredItems = items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.id.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredPosItems = items.filter(item => item.name.toLowerCase().includes(posSearchQuery.toLowerCase()) || item.id.toLowerCase().includes(posSearchQuery.toLowerCase()));
  return <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Pharmacy POS System
        </h1>

        {/* Tabs */}
        <div className="flex space-x-1 bg-white rounded-lg shadow mb-6 p-1">
          {['dashboard', 'pos', 'inventory', 'reorder'].map(tab => <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${activeTab === tab ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>)}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Total Items</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {items.length}
                    </p>
                  </div>
                  <PackageIcon className="w-12 h-12 text-blue-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Low Stock Items</p>
                    <p className="text-3xl font-bold text-red-500">
                      {lowStockItems.length}
                    </p>
                  </div>
                  <AlertTriangleIcon className="w-12 h-12 text-red-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Last Sale</p>
                    <p className="text-3xl font-bold text-green-500">
                      ${lastSaleAmount.toFixed(2)}
                    </p>
                  </div>
                  <DollarSignIcon className="w-12 h-12 text-green-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <AlertTriangleIcon className="w-6 h-6 text-red-500 mr-2" />
                Low Stock Alerts
              </h2>
              {lowStockItems.length === 0 ? <p className="text-gray-500">
                  All items are adequately stocked.
                </p> : <div className="space-y-3">
                  {lowStockItems.map(item => <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">
                          Reorder Level: {item.reorderLevel}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">
                          {item.stock} in stock
                        </p>
                      </div>
                    </div>)}
                </div>}
            </div>
          </div>}

        {/* POS Tab */}
        {activeTab === 'pos' && <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel - Products */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Available Items
              </h2>
              <div className="mb-4">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="text" placeholder="Search by item name or ID..." value={posSearchQuery} onChange={e => setPosSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredPosItems.map(item => <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        ${item.price.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Stock: {item.stock}
                      </p>
                    </div>
                    <button onClick={() => addToCart(item.id)} disabled={item.stock === 0} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                      Add to Cart
                    </button>
                  </div>)}
              </div>
            </div>

            {/* Right Panel - Cart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <ShoppingCartIcon className="w-6 h-6 mr-2" />
                Shopping Cart
              </h2>

              <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto">
                {cart.length === 0 ? <p className="text-gray-500 text-center py-8">
                    Cart is empty
                  </p> : cart.map(cartItem => {
              const item = items.find(i => i.id === cartItem.itemId)!;
              return <div key={cartItem.itemId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {item.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            ${item.price.toFixed(2)} each
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => updateCartQuantity(cartItem.itemId, -1)} className="p-1 rounded hover:bg-gray-100">
                            <MinusIcon className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium">
                            {cartItem.quantity}
                          </span>
                          <button onClick={() => updateCartQuantity(cartItem.itemId, 1)} className="p-1 rounded hover:bg-gray-100">
                            <PlusIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => removeFromCart(cartItem.itemId)} className="p-1 rounded hover:bg-red-100 text-red-600 ml-2">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>;
            })}
              </div>

              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-bold text-gray-900">
                    Total:
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Section */}
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <button onClick={() => setPaymentMethod('cash')} className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${paymentMethod === 'cash' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                    Cash
                  </button>
                  <button onClick={() => setPaymentMethod('card')} className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${paymentMethod === 'card' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                    Card
                  </button>
                </div>

                {paymentMethod === 'cash' && <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount Received
                    </label>
                    <input type="number" step="0.01" value={cashReceived} onChange={e => setCashReceived(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0.00" />
                    {cashReceived && <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Balance:</span>
                          <span className={`font-bold ${cashBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${Math.abs(cashBalance).toFixed(2)}{' '}
                            {cashBalance >= 0 ? 'Change' : 'Short'}
                          </span>
                        </div>
                      </div>}
                  </div>}

                {paymentMethod === 'card' && <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <p className="text-blue-800">Card payment ready</p>
                  </div>}

                <button onClick={completePurchase} disabled={!canCompletePurchase} className="w-full py-4 bg-green-500 text-white rounded-lg font-bold text-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                  Complete Purchase
                </button>
              </div>
            </div>
          </div>}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Add New Item
              </h2>
              <form onSubmit={addNewItem} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input type="text" placeholder="Item Name" value={newItemForm.name} onChange={e => setNewItemForm({
              ...newItemForm,
              name: e.target.value
            })} required className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <input type="number" step="0.01" placeholder="Price" value={newItemForm.price} onChange={e => setNewItemForm({
              ...newItemForm,
              price: e.target.value
            })} required className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <input type="number" placeholder="Stock Quantity" value={newItemForm.stock} onChange={e => setNewItemForm({
              ...newItemForm,
              stock: e.target.value
            })} required className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <input type="number" placeholder="Reorder Level" value={newItemForm.reorderLevel} onChange={e => setNewItemForm({
              ...newItemForm,
              reorderLevel: e.target.value
            })} required className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <button type="submit" className="md:col-span-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
                  Add Item
                </button>
              </form>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-4">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="text" placeholder="Search by item name or ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>

              <div className="overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Item ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Reorder Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredItems.map(item => <tr key={item.id} className={item.stock <= item.reorderLevel ? 'bg-red-50' : ''}>
                        {editingItemId === item.id ? <>
                            <td className="px-6 py-4 text-gray-500 text-sm">
                              {item.id}
                            </td>
                            <td className="px-6 py-4">
                              <input type="text" value={editForm.name} onChange={e => setEditForm({
                        ...editForm,
                        name: e.target.value
                      })} className="w-full px-2 py-1 border rounded" />
                            </td>
                            <td className="px-6 py-4">
                              <input type="number" step="0.01" value={editForm.price} onChange={e => setEditForm({
                        ...editForm,
                        price: e.target.value
                      })} className="w-full px-2 py-1 border rounded" />
                            </td>
                            <td className="px-6 py-4">
                              <input type="number" value={editForm.stock} onChange={e => setEditForm({
                        ...editForm,
                        stock: e.target.value
                      })} className="w-full px-2 py-1 border rounded" />
                            </td>
                            <td className="px-6 py-4">
                              <input type="number" value={editForm.reorderLevel} onChange={e => setEditForm({
                        ...editForm,
                        reorderLevel: e.target.value
                      })} className="w-full px-2 py-1 border rounded" />
                            </td>
                            <td className="px-6 py-4">
                              <button onClick={saveEdit} className="text-green-600 hover:text-green-800 mr-2">
                                <CheckIcon className="w-5 h-5" />
                              </button>
                              <button onClick={() => setEditingItemId(null)} className="text-gray-600 hover:text-gray-800">
                                <XIcon className="w-5 h-5" />
                              </button>
                            </td>
                          </> : <>
                            <td className="px-6 py-4 text-gray-500 text-sm">
                              {item.id}
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-900">
                              {item.name}
                            </td>
                            <td className="px-6 py-4 text-gray-700">
                              ${item.price.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-gray-700">
                              {item.stock}
                            </td>
                            <td className="px-6 py-4 text-gray-700">
                              {item.reorderLevel}
                            </td>
                            <td className="px-6 py-4">
                              <button onClick={() => startEditing(item)} className="text-blue-600 hover:text-blue-800 mr-3">
                                <EditIcon className="w-5 h-5" />
                              </button>
                              <button onClick={() => deleteItem(item.id)} className="text-red-600 hover:text-red-800">
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </td>
                          </>}
                      </tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>}

        {/* Reorder Tab */}
        {activeTab === 'reorder' && <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Reorder Stock
            </h2>
            {lowStockItems.length === 0 ? <div className="text-center py-12">
                <CheckIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-xl font-medium text-gray-900">
                  All items are adequately stocked!
                </p>
                <p className="text-gray-600 mt-2">
                  No items need reordering at this time.
                </p>
              </div> : <div className="space-y-4">
                {lowStockItems.map(item => {
            const suggestedOrder = Math.max(item.reorderLevel * 2 - item.stock, item.reorderLevel);
            return <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <div className="flex space-x-4 mt-1 text-sm text-gray-600">
                          <span>
                            Current Stock:{' '}
                            <span className="font-medium text-red-600">
                              {item.stock}
                            </span>
                          </span>
                          <span>
                            Reorder Level:{' '}
                            <span className="font-medium">
                              {item.reorderLevel}
                            </span>
                          </span>
                          <span>
                            Suggested Order:{' '}
                            <span className="font-medium text-green-600">
                              {suggestedOrder}
                            </span>
                          </span>
                        </div>
                      </div>
                      <button onClick={() => placeOrder(item.id)} className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
                        Place Order
                      </button>
                    </div>;
          })}
              </div>}
          </div>}
      </div>

      {/* Receipt Modal */}
      {showReceipt && receiptData && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Receipt</h2>
              <p className="text-sm text-gray-600">{receiptData.date}</p>
            </div>

            <div className="border-t border-b py-4 mb-4">
              {receiptData.items.map((item, index) => {
            const originalItem = items.find(i => i.name === item.name);
            return <div key={index} className="mb-3">
                    <div className="flex justify-between mb-1">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          ID: {originalItem?.id}
                        </p>
                        <p className="text-sm text-gray-600">
                          {item.quantity} x ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-medium text-gray-900">
                        ${item.total.toFixed(2)}
                      </p>
                    </div>
                  </div>;
          })}
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-lg font-bold">
                <span>Subtotal:</span>
                <span>${receiptData.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Payment Method:</span>
                <span>{receiptData.paymentMethod}</span>
              </div>
              {receiptData.amountReceived && <>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Amount Received:</span>
                    <span>${receiptData.amountReceived.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-green-600">
                    <span>Change:</span>
                    <span>${receiptData.change!.toFixed(2)}</span>
                  </div>
                </>}
            </div>

            <div className="text-center mb-6">
              <p className="text-lg font-medium text-gray-900">
                Thank you for your purchase!
              </p>
            </div>

            <div className="flex space-x-3">
              <button onClick={printReceipt} className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center justify-center">
                <PrinterIcon className="w-5 h-5 mr-2" />
                Print Receipt
              </button>
              <button onClick={() => setShowReceipt(false)} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium">
                Close
              </button>
            </div>
          </div>
        </div>}
    </div>;
}