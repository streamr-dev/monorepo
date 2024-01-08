# Stream Sponsorships
Stream Sponsorships are smart contracts for managing a stream of earnings distributed among a set of Operators. Those Operators run nodes which join the sponsored stream and help to relay the traffic inside it. [Sponsors](../network-roles/sponsors.md) create and fund stream Sponsorships and staked [Operators](../network-roles/operators.md) earn from them. 

## The Sponsorship process
Here’s the life cycle of a stream Sponsorship:

1. The Sponsorship contract is created which describes the policies and parameters for how the DATA tokens will be distributed. The headline parameters are:
    - Length of Sponsorship
    - Amount of DATA tokens 
    - Minimum staking duration
    - Minimum number of Operators
2. A Sponsor pays DATA tokens into the Sponsorship smart contract. 
3. Operators join the Sponsorship by staking on it. 
4. Operators’ nodes join the sponsored stream overlay network and relay data in the stream.
5. If/when the Sponsorship runs low on tokens they can be “topped up”, extending the time that the Sponsorship will continue to distribute funds at the configured emission rate.

[Operators](../network-roles/operators.md) can join or leave Sponsorships at any time, subject to conditions like minimum stake and penalties for early withdrawal or misconduct. Under normal conditions their staked DATA tokens are returned in full.

### Earnings split
The proportion of earnings that each Owner-Operator and delegators receive is based on:
- Their indirect stake in the Sponsorship contract
- The **owner's cut** percentage in each Operator that has staked into the Sponsorship

![image](@site/static/img/stream-sponsorship.png)
<!-- TODO bigger stake numbers -->
In this example, the Operator with the smaller **Owner's cut** has attracted more delegation, and thus a larger share of the earnings emitted from the Sponsorship smart contract.

The amount of DATA tokens the Operator stakes on the Sponsorship determines the size of their share of the token flow. The Operator will generally stake on Sponsorships where they can earn the best available yield for their stake. Other Operators in a Sponsorship are there to share the cake, so overcrowded Sponsorships may not offer the best yields, and some Operators will decide to mine other Sponsorships instead. Like any open market, the market of servicing Sponsorships will always gravitate towards achieving equilibrium between supply and demand. Note that the Operator owner earns twice- once for due to their owner's cut and twice due to their own stake in their Operator. 

## Use cases
Firstly, in situations where data publishers or subscribers can’t be actual nodes in the Streamr Network, for one reason or another, a set of decentralized Streamr nodes can be made available to perform the task of proxying the data from or into the Streamr Network. These nodes can be thought of as proxy or gateway nodes capable of pushing or pulling data into or from an external environment. Sponsorships offers a convenient and practical way of hiring these gateway proxy nodes which are especially useful in resource restricted environments. 

Private communications also come into focus. On Streamr, when end-to-end encryption is activated, message content is indeed private, however, some metadata is still visible—your IP address for example is still visible and in small network topologies it’s possible to match a data publisher with message delivery. However, if the overlay network was boosted with a Sponsorship to increase the node count to, let’s say, thousands of nodes, then any node would be one in a very large crowd. It would be far more difficult to identify a data publisher or subscriber in any meaningful way. Pair this with Streamr’s already decentralized nature and you get a level of anonymity and sovereignty that’s competitive with the most secure and private solutions available on the open internet today.

We can also speculate that Sponsorships will encourage large scale live media streaming on Streamr. For everyone that thought that Streamr was for video streaming, well, they could be right in the end. In Streamr 1.0, there’s no reason why media streams can’t be Streamr streams. Sponsoring a media stream is very likely to bring down the bandwidth costs for streamers that are dependent on exploitive closed platform infrastructure. We’ll have much more to say about this as 1.0 gets closer.

