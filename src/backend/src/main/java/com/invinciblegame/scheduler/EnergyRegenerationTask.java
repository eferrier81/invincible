package com.invinciblegame.scheduler;

import com.invinciblegame.service.EnergyService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class EnergyRegenerationTask {
    private final EnergyService energyService;

    public EnergyRegenerationTask(EnergyService energyService) {
        this.energyService = energyService;
    }

    /** Hourly pass: applies time-based regen (+1 per full hour since last tick) for every user. */
    @Scheduled(fixedRate = 60 * 60 * 1000)
    public void regenerateEnergyHourly() {
        energyService.syncAllUsers();
    }
}
