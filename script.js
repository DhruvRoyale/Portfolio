let asset_1 = [10, 12, 11, 13, 14, 12, 14, 16, 14, 18, 17]
let asset_2 = [32, 34, 24, 32, 23, 48, 34, 65, 57, 60, 80]
let current_correl = 0;
let actual_correl = 0;
let graph_data = {
    "w1": [],
    "w2": [],
    "port-return": [],
    "port-std-dev": []
};

let min_risk_port = {}

function calculate() {
    // Ensure both assets have the same data length
    if (asset_1.length != asset_2.length || !asset_1.length) {
        console.log("Error")
        return
    }

    let returns_asset_1 = find_return_array(asset_1)
    let returns_asset_2 = find_return_array(asset_2)

    let exp_return_1 = average(returns_asset_1)
    let exp_return_2 = average(returns_asset_2)

    let var_1 = variance(returns_asset_1)
    let var_2 = variance(returns_asset_2)

    let sqrt_1 = Math.sqrt(var_1)
    let sqrt_2 = Math.sqrt(var_2)

    actual_correl = correlation(returns_asset_1, returns_asset_2)
    current_correl = actual_correl

    find_lines(exp_return_1, exp_return_2, sqrt_1, sqrt_2, actual_correl)
    find_min_risk_point()
    plot_graph()
}

function find_return_array(data) {
    let returns = []
    for (let i = 1; i < data.length; i++) {
        returns[i-1] = (data[i] - data[i - 1]) / data[i - 1]
    }

    return returns
}

function average(data) {
    let avg = 0;

    // Find mean
    for (let i = 0; i < data.length; i++) {
        avg += data[i]
    }

    return avg / data.length
}

function variance(data) {
    let data_mean = average(data)

    let variance = 0;
    for (let i = 0; i < data.length; i++) {
        variance += (data[i] - data_mean) ** 2
    }

    return variance / (data.length - 1)
}

function correlation(data1, data2) {
    if (data1.length != data2.length) {
        console.log("Unable to find correlation")
        return
    }

    let avg_1 = average(data1)
    let avg_2 = average(data2)

    let numerator = 0;
    let sum_dev_square_1 = 0;
    let sum_dev_square_2 = 0;

    for (let i = 0; i < data1.length; i++) {
        numerator += (data1[i] - avg_1) * (data2[i] - avg_2)
        sum_dev_square_1 += (data1[i] - avg_1) ** 2
        sum_dev_square_2 += (data2[i] - avg_2) ** 2
    }

    return numerator / Math.sqrt(sum_dev_square_1 * sum_dev_square_2)
}

function find_lines(exp_return_1, exp_return_2, sqrt_1, sqrt_2, correl) {
    let weight_2 = 0;
    let port_return = 0;
    let port_std_dev = 0;
    graph_data = {
        "w1": [],
        "w2": [],
        "port-return": [],
        "port-std-dev": []
    }

    for (let weight_1 = 0; weight_1 <= 100; weight_1++) {
        weight_2 = 100 - weight_1
        port_return = (weight_1 / 100) * exp_return_1 + (weight_2 / 100) * exp_return_2
        port_std_dev = Math.sqrt(((weight_1 / 100) ** 2) * (sqrt_1 ** 2) + ((weight_2 / 100) ** 2) * (sqrt_2 ** 2) + (2 * (weight_1 / 100) * (weight_2 / 100) * correl * sqrt_1 * sqrt_2))

        graph_data["w1"].push(weight_1 / 100)
        graph_data["w2"].push(weight_2 / 100)
        graph_data["port-return"].push(port_return)
        graph_data["port-std-dev"].push(port_std_dev)
    }
}

function find_min_risk_point() {
    // ... is the spread operator to spread the array
    let min_var_index = graph_data["port-std-dev"].indexOf(Math.min(...graph_data["port-std-dev"]))

    min_risk_port = {"w1": graph_data["w1"][min_var_index], "w2": graph_data["w2"][min_var_index], 
        "port-return": graph_data["port-return"][min_var_index], "port-std-dev": graph_data["port-std-dev"][min_var_index]
    }

    document.querySelector("#w1").innerHTML = min_risk_port["w1"]
    document.querySelector("#w2").innerHTML = min_risk_port["w2"]
    document.querySelector("#port-return").innerHTML = min_risk_port["port-return"]
    document.querySelector("#port-std-dev").innerHTML = min_risk_port["port-std-dev"]
}

function plot_graph() {
    // Risk-return graph
    let risk_return_values = []
    for (let i = 0; i < graph_data["port-return"].length; i++) {
        risk_return_values.push({"x": graph_data["port-std-dev"][i], "y": graph_data["port-return"][i]})
    }

    let min_risk_point = [{"x": min_risk_port["port-std-dev"], "y": min_risk_port["port-return"]}]

    new Chart("risk-return", {
        type: "scatter",
        data: {
            datasets: [{
                label: "Portfolio",
                type: "scatter",
                pointRadius: 4,
                pointBackgroundColor: "rgba(0, 0, 255, 1)",
                data: risk_return_values,
                order: 2,
                backgroundColor: "rgba(0, 0, 255, 1)"
            }, {
                label: "Minimum Variance Point",
                type: "scatter",
                pointRadius: 4,
                pointBackgroundColor: "rgba(0, 255, 0, 1)",
                data: min_risk_point,
                order: 1,
                backgroundColor: "rgba(0, 255, 0, 1)"
            }]
        }
    })

    // Return-weight graph
    new Chart("return-weight", {
        type: "line",
        data: {
            labels: graph_data["w1"],
            datasets: [{
                label: "Return",
                borderColor: "rgba(0, 0, 255, 1)",
                fill: false,
                data: graph_data["port-return"],
                backgroundColor: "rgba(0, 0, 255, 1)"
            }]
        }
    })

    // Variance-weight graph
    let variance_values = []
    for (let i = 0; i < graph_data["port-std-dev"].length; i++) {
        variance_values.push(graph_data["port-std-dev"][i] ** 2)
    }

    new Chart("variance-weight", {
        type: "line",
        data: {
            labels: graph_data["w1"],
            datasets: [{
                label: "Variance",
                borderColor: "rgba(0, 0, 255, 1)",
                fill: false,
                data: variance_values,
                backgroundColor: "rgba(0, 0, 255, 1)"
            }]
        }
    })
}

function display_screen(screen) {
	let screens = ["graph-screen", "data-screen"]
	
	for (let i = 0; i < screens.length; i++) {
		if (screens[i] == screen) {
			document.querySelector("." + screens[i]).hidden = false;
		} else {
			document.querySelector("." + screens[i]).hidden = true;
		}
	}
}

window.addEventListener("load", calculate)