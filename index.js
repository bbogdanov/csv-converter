function to24HourFormat(timeStr) {
  // Expect "h:mm:ss AM/PM"
  const [time, modifier] = timeStr.trim().split(" ");
  let [hours, minutes, seconds] = time.split(":").map(Number);

  if (modifier.toUpperCase() === "PM" && hours !== 12) {
    hours += 12;
  }
  if (modifier.toUpperCase() === "AM" && hours === 12) {
    hours = 0;
  }

  // Pad only minutes + seconds
  const hh = String(hours); // <- don't pad so "9" stays "9", "15" stays "15"
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  return `${hh}:${mm}:${ss}`;
}

export function transformToGeneric(filledOrders) {
  // Split into rows and parse header
  const rows = filledOrders.split('\n');
  const header = rows[0].split(';');

  // Map header indices
  const indices = {
    dateTime: 0,
    symbol: 1,
    side: 2,
    quantity: 3,
    price: 4,
    commission: 5
  };
  

  // Prepare transformed rows
  const transformedRows = ['Date,Time,Symbol,Buy/Sell,Quantity,Price,Spread,Expiration,Strike,Call/Put,Commission,Fees'];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i].split(';');
    if (row.length < header.length) continue; // Skip incomplete rows

    // Extract and transform fields
    let [date, time, noonOrNot] = row[indices.dateTime].split(' ');
    time = to24HourFormat(time + ' ' + noonOrNot); // Convert time to 24-hour format
    
    const formattedDate = date.replace(/^(\d{2})\.(\d{2})\.(\d{4})$/, (match, day, month, year) => `${month}/${day}/${year.slice(-2)}`); // Convert DD.MM.YYYY to MM/DD/YY
    const symbol = row[indices.symbol];
    const side = row[indices.side];
    const quantity = row[indices.quantity].replace(/,/g, ''); // Remove commas from quantity
    const price = row[indices.price];
    const commission = row[indices.commission].replace(' USD', '') === '0.00' ? '' : row[indices.commission].replace(' USD', '');

    // Add expiration field transformation with abbreviated month name
    const [month, day] = date.split('/');
    const monthNamesAbbreviated = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const expiration = `${monthNamesAbbreviated[parseInt(month, 10) - 1]} ${day}`; // MMM DD format

    // Update transformed row to include expiration
    transformedRows.push(`${formattedDate},${time},${symbol},${side},${quantity},${price},Stock,${expiration},,,,${commission},`);
  }

  // Write to output file
  return transformedRows.join('\n');
}