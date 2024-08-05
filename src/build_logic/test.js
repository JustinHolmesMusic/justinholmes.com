let test_array = [
    [100, '0x123'],
    [200, '0x456']
]


let new_array = test_array.map(([amount, address]) => {
    return {amount, address};
});

console.log(new_array);